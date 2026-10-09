import { post } from '../alerts/post.ts';
import type { Env, Hit, Session, Starred, StoreView } from '../types.ts';
import { reauth } from './auth.ts';
import * as repo from './repo.ts';
import { CURRENT_KID, open, seal } from './seal.ts';
import { fetchStore } from './storefront.ts';

/**
 * The daily wishlist check.
 *
 * The wishlist holds skin LEVEL uuids with their names, resolved by the browser
 * when the user saved it. That is the whole reason this job can be dumb: it does
 * a set intersection and never touches the 3.5 MB catalogue, which would not fit
 * in the Worker's CPU budget anyway.
 *
 * TRAFFIC SHAPE — worth stating, because it is the real risk here. An unattended
 * job replaying stored sessions from datacenter IPs is structurally what
 * credential stuffing looks like. The one variable that separates us is the auth
 * SUCCESS rate, so: only rows that asked for alerts are polled, a dead session is
 * dropped rather than retried, and the run stops early if failures dominate.
 */

/** Stop the run if this share of reauths fail — that is our bug or Riot changing
 *  something, and continuing looks exactly like brute force. */
const FAIL_STOP = 0.5;
const MIN_BEFORE_STOP = 4;

/**
 * Pure: which wishlist entries are in today's store, with what Riot is
 * charging for each. Unit-testable, no network.
 *
 * The price is the one thing the morning mail shows that is not on the
 * starred row — it belongs to today's panel rather than to the star — so it
 * is picked up here, where the two meet. A night market price wins over the
 * daily one, because that is the number you would actually pay.
 */
export function hits(view: StoreView, wishlist: Starred[]): Hit[] {
  const offered = new Map<string, number | null>();
  for (const o of view.offers) offered.set(o.id, o.cost);
  for (const n of view.night?.items ?? []) if (n.id) offered.set(n.id, n.price ?? n.cost);
  return wishlist.filter((w) => offered.has(w.id)).map((w) => ({ ...w, cost: offered.get(w.id) }));
}

export async function runAlerts(env: Env): Promise<{ checked: number; sent: number }> {
  if (!env.JAR_KEY) throw new Error('JAR_KEY missing: cannot open any session');
  const rows = await repo.listAlerting(env);
  console.log('alerts: ' + rows.length + ' row(s) opted in');
  let checked = 0;
  let failed = 0;
  let sent = 0;

  for (const row of rows) {
    if (checked >= MIN_BEFORE_STOP && failed / checked > FAIL_STOP) {
      console.log('alerts: stopping early, failure rate too high');
      break;
    }
    checked++;
    try {
      const session = await open<Session>(env, row.uid, row.kid, row.blob);
      // A verified address or a webhook. An unverified address is not a
      // channel: nothing is ever sent to one, which is the rule the whole
      // OTP flow exists to keep.
      if (!session.wishlist?.length) continue;
      if (!session.notify?.discord && session.mail?.ok !== true) continue;

      const t = await reauth(session.jar);
      if (!t) {
        // Dead at Riot. Drop the row instead of retrying it tomorrow, which is
        // what would turn one stale session into a daily failed login forever.
        failed++;
        await repo.remove(env, row.uid);
        continue;
      }

      const view = await fetchStore(env, session, t);
      const found = hits(view, session.wishlist);
      if (found.length && (await post(env, row.uid, session, found, view.remaining))) sent++;
      // Persist the rolled-forward jar; a lost CAS just means a tab beat us.
      await repo.update(env, row.uid, await seal(env, row.uid, CURRENT_KID, session), row.ver);
    } catch (e) {
      // A job that swallows failures silently is a job that rots unnoticed. The
      // error name is safe to log; the message never contains a jar or a token.
      failed++;
      console.log('alerts: row failed: ' + (e as Error).name + ' ' + (e as Error).message);
    }
  }
  return { checked, sent };
}
