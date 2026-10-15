import { deliver } from '../discord/delivery.ts';
import * as deliveries from '../storage/deliveries.ts';
import * as messages from '../storage/messages.ts';
import type { Env } from '../types.ts';
import type { Budget } from '../vault/budget.ts';
import { send } from '../vault/mail.ts';
import { CURRENT_KID, open } from '../vault/seal.ts';
import { alerting, readSession } from '../vault/session.ts';
import type { Outbox } from './outbox.ts';
import { target } from './target.ts';

/** A persisted payload is retried without re-polling Riot or changing its body. */
export async function dispatch(
  env: Env,
  id: string,
  queued: { owner: string; blob: string },
  budget?: Budget,
): Promise<boolean> {
  let ok = false;
  let wait: number | undefined;
  try {
    const body = await open<Outbox>(env, id, CURRENT_KID, queued.blob, 'outbox:2');
    const source = await readSession(env, body.uid);
    const destination = source && target(source.session, body.channel);
    const consent =
      source &&
      (body.channel === 'mail' || body.channel === 'discord') &&
      !!body.gen &&
      alerting(source.session) &&
      body.until > Date.now() &&
      destination &&
      destination.gen === body.gen &&
      destination.to === (body.channel === 'mail' ? body.to.toLowerCase() : body.to);
    if (!consent) {
      ok = true;
      return true;
    }
    if (body.channel === 'discord') {
      const report = await deliver(env, id, body, source.session, budget);
      ok = report.ok;
      wait = report.wait;
    } else {
      await messages.reserve(env, id, body.uid, body.gen as string);
      const report = await send(env, body.to, body.subject, body.html, body.text, { id, budget });
      if (report.id) await messages.bind(env, id, report.id);
      ok = report.ok;
    }
  } catch {
    // A delivery failure is not a failed Riot reauth. Keep the queue for a later
    // bounded retry; its payload expiry prevents sending yesterday's store.
  } finally {
    await deliveries.finish(env, id, queued.owner, ok, wait);
  }
  return ok;
}
export async function retry(env: Env, budget: Budget): Promise<number> {
  let sent = 0;
  for (const row of await deliveries.pending(env)) {
    if (budget.left < 4) break;
    const queued = await deliveries.claim(env, row.key, row.blob);
    if (queued.state === 'claimed' && (await dispatch(env, row.key, queued, budget))) sent++;
  }
  return sent;
}
