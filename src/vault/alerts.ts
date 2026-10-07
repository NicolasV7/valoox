import type { Env, Session, StoreView } from '../types.ts';
import { reauth } from './auth.ts';
import { rf } from './http.ts';
import * as repo from './repo.ts';
import { open, seal } from './seal.ts';
import { CURRENT_KID } from './seal.ts';
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

export interface Hit {
  id: string;
  name: string;
}

/** Pure: which wishlist entries are in today's store. Unit-testable, no network. */
export function hits(view: StoreView, wishlist: Array<{ id: string; name: string }>): Hit[] {
  const offered = new Set(view.offers.map((o) => o.id));
  for (const n of view.night?.items ?? []) if (n.id) offered.add(n.id);
  return wishlist.filter((w) => offered.has(w.id));
}

export function message(found: Hit[]): string {
  const names = found.map((h) => h.name);
  return names.length === 1
    ? names[0] + ' está en tu tienda hoy.'
    : names.join(', ') + ' están en tu tienda hoy.';
}

type Notify = NonNullable<Session['notify']>;

/**
 * Delivery. The payload carries no puuid, no uid and no credential — only skin
 * names the user themselves chose.
 *
 * Both are tried when both are configured, and it counts as delivered if EITHER
 * lands: ntfy.sh throttles by source IP and Cloudflare's egress is shared and
 * busy (measured: a consistent 429 from a Worker while the same topic accepts a
 * request from a laptop), so ntfy alone is not dependable from here.
 */
async function notify(to: Notify, found: Hit[]): Promise<void> {
  const text = message(found);
  const tries: Array<Promise<Response>> = [];

  if (to.ntfy) {
    tries.push(
      rf('https://ntfy.sh/' + to.ntfy, {
        method: 'POST',
        headers: {
          Title: 'Tienda de VALORANT',
          Tags: 'dart',
          'Content-Type': 'text/plain',
          ...(to.ntfyToken ? { Authorization: 'Bearer ' + to.ntfyToken } : {}),
        },
        body: text,
      }),
    );
  }
  if (to.discord) {
    tries.push(
      rf('https://discord.com/api/webhooks/' + to.discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      }),
    );
  }
  if (!tries.length) return;

  const results = await Promise.allSettled(tries);
  const ok = results.some((r) => r.status === 'fulfilled' && r.value.ok);
  // A throttled push counted as delivered is the worst bug a notifier can have:
  // it reports success for something nobody received.
  if (!ok) {
    const codes = results.map((r) => (r.status === 'fulfilled' ? r.value.status : 'threw')).join('/');
    throw new Error('no delivery channel accepted: ' + codes);
  }
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
      const to = session.notify;
      if (!session.wishlist?.length || !to || !(to.ntfy || to.discord)) continue;

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
      if (found.length) {
        await notify(to, found);
        sent++;
      }
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
