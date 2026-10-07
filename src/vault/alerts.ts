import type { Env, Session, StoreView } from '../types.ts';
import { reauth } from './auth.ts';
import { rf } from './http.ts';
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
 * A fresh ntfy topic.
 *
 * Minted here rather than asked for. A topic is a public mailbox — anyone who
 * knows the name reads everything sent to it — so a name a person would invent is
 * a name a stranger can guess. Eighty bits of randomness behind a prefix that
 * says where it came from, which also makes it typeable into the ntfy app.
 */
export function mintTopic(): string {
  const b = crypto.getRandomValues(new Uint8Array(10));
  return 'val-' + [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * ntfy.sh does not answer reliably from here.
 *
 * MEASURED 2026-10-07, from a deployed Worker, publish and GET /v1/health alike:
 * roughly one request in four never completes a TCP connection and comes back as
 * a Cloudflare 522 after 19 to 39 seconds. It happens with a token and without
 * one, so it is not the rate limit and not the payload — it is the route between
 * Cloudflare's egress and ntfy's origin. The same requests from a laptop are
 * 200 in 300ms.
 *
 * Nothing here can fix that, so this bounds the wait and tries again. Three
 * attempts at six seconds puts the odds of losing an alert near one in sixty,
 * and costs 18 seconds in the worst case — which a job that runs once a day, and
 * a button that says "Enviando…", can both afford.
 */
const NTFY_TRIES = 3;
const NTFY_TIMEOUT = 6000;

async function publishNtfy(env: Env, topic: string, text: string): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < NTFY_TRIES; i++) {
    try {
      const res = await rf('https://ntfy.sh/' + topic, {
        method: 'POST',
        headers: {
          Title: 'Tienda de VALORANT',
          Tags: 'dart',
          'Content-Type': 'text/plain',
          // Anonymous publishing is limited per source IP, and a Worker has no
          // IP of its own — it shares Cloudflare's egress with everyone. The
          // token moves the limit onto this service's own ntfy account.
          ...(env.NTFY_TOKEN ? { Authorization: 'Bearer ' + env.NTFY_TOKEN } : {}),
        },
        body: text,
        signal: AbortSignal.timeout(NTFY_TIMEOUT),
      });
      if (res.ok) return res;
      last = res;
    } catch {
      // Aborted, or the connection never opened. Both are worth another go, and
      // neither is worth logging: the status of the last attempt is the story.
    }
  }
  // Ours, not ntfy's: every attempt timed out before anything answered.
  return last ?? new Response(null, { status: 504 });
}

/**
 * Delivery. The payload carries no puuid, no uid and no credential — only skin
 * names the user themselves chose.
 *
 * Both channels are tried when both are set and it counts as delivered if EITHER
 * lands. Discord answers in 7ms and ntfy does not always answer at all, so a
 * second channel is worth more here than it looks.
 */
export async function deliver(env: Env, to: Notify, text: string): Promise<string[]> {
  const tries: Array<[string, Promise<Response>]> = [];

  if (to.ntfy) tries.push(['ntfy', publishNtfy(env, to.ntfy, text)]);
  if (to.discord) {
    tries.push([
      'discord',
      rf('https://discord.com/api/webhooks/' + to.discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      }),
    ]);
  }
  // Reporting success for a message with nowhere to go is the same bug as
  // reporting success for a throttled one, so it fails the same way.
  if (!tries.length) throw new Error('no hay ningún canal configurado');

  const results = await Promise.allSettled(tries.map(([, p]) => p));
  // Every outcome is named. A bare "429" sent us measuring the wrong thing once;
  // "ntfy 429" says which door was shut.
  const report = results.map((r, i) => {
    const name = tries[i][0];
    return r.status === 'fulfilled' ? name + ' ' + r.value.status : name + ' sin respuesta';
  });

  // A throttled push counted as delivered is the worst bug a notifier can have:
  // it reports success for something nobody received.
  if (!results.some((r) => r.status === 'fulfilled' && r.value.ok)) {
    throw new Error(report.join(', '));
  }
  return report;
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
        await deliver(env, to, message(found));
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
