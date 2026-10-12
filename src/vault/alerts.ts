import { retry } from '../alerts/dispatch.ts';
import { post } from '../alerts/post.ts';
import type { Env } from '../types.ts';
import { reauth } from './auth.ts';
import { Budget } from './budget.ts';
import { recipients } from './group.ts';
import { hits } from './match.ts';
import * as repo from './repo.ts';
import { CURRENT_KID } from './seal.ts';
import { alerting, readSession, saveSession } from './session.ts';
import { fetchStore } from './storefront.ts';

export { hits } from './match.ts';

const MAX_ROWS = 6;

export async function runAlerts(
  env: Env,
  at = Date.now(),
): Promise<{ checked: number; sent: number; skipped: number }> {
  // The first half hour lets the new storefront settle. Remaining batches run
  // during the same rotation, rather than postponing overflow until tomorrow.
  const date = new Date(at);
  if (date.getUTCHours() === 0 && date.getUTCMinutes() < 30)
    return { checked: 0, sent: 0, skipped: 0 };
  const rotation = date.toISOString().slice(0, 10);
  const rows = await repo.listAlerting(env, MAX_ROWS + 1, rotation);
  const budget = new Budget();
  let checked = 0;
  let failed = 0;
  let sent = await retry(env, budget);
  const seen = new Set<string>();
  for (const row of rows.slice(0, MAX_ROWS)) {
    if (budget.left < 8 || (checked >= 4 && failed / checked > 0.5)) break;
    if (row.acct && seen.has(row.acct)) continue;
    checked++;
    // Advancing even failed/invalid rows prevents starvation of later browsers.
    await repo.checked(env, row.uid);
    if (row.kid !== CURRENT_KID) {
      await repo.setAlerts(env, row.uid, false, row.ver);
      continue;
    }
    try {
      const held = await readSession(env, row.uid);
      if (!held) continue;
      const s = held.session;
      if (!alerting(s) || !s.puuid || !s.shard) {
        await repo.setAlerts(env, row.uid, false, held.ver);
        continue;
      }
      const t = await reauth(s.jar, budget);
      if (!t) {
        failed++;
        await repo.remove(env, row.uid);
        continue;
      }
      if (!(await saveSession(env, row.uid, s, held.ver))) continue;
      const view = await fetchStore(env, s, t, { lean: true, budget });
      const targets = await recipients(env, row);
      let complete = true;
      for (const target of targets) {
        const found = hits(view, target.session.wishlist ?? []);
        if (!found.length) continue;
        if (budget.left < 4) {
          complete = false;
          break;
        }
        if (await post(env, target.uid, target.session, found, view.remaining, budget, rotation))
          sent++;
        // Delivery failures are queued separately; do not re-poll Riot for them.
      }
      if (row.acct) seen.add(row.acct);
      if (complete) {
        for (const uid of new Set(targets.flatMap((target) => target.rows))) {
          await repo.checked(env, uid, rotation);
        }
      }
    } catch {
      failed++;
      console.log('alerts: row failed');
    }
  }
  return { checked, sent, skipped: Math.max(0, rows.length - checked) };
}
