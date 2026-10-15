import { build as discordAlert } from '../discord/alert.ts';
import * as deliveries from '../storage/deliveries.ts';
import type { Env, Hit, Session } from '../types.ts';
import type { Budget } from '../vault/budget.ts';
import { fingerprint } from '../vault/keys.ts';
import { CURRENT_KID, seal } from '../vault/seal.ts';
import { readSession } from '../vault/session.ts';
import { markOf } from '../vault/who.ts';
import { dispatch } from './dispatch.ts';
import { build } from './outbox.ts';
import { type Channel, target } from './target.ts';

export async function post(
  env: Env,
  uid: string,
  session: Session,
  found: Hit[],
  left: number,
  budget?: Budget,
  rotation = new Date().toISOString().slice(0, 10),
  channel: Channel = 'mail',
): Promise<boolean> {
  const current = await readSession(env, uid);
  if (!current || current.session.puuid !== session.puuid) return false;
  const destination = target(session, channel);
  const live = target(current.session, channel);
  if (!destination || !live || destination.gen !== live.gen || destination.to !== live.to)
    return false;
  const acct = (await markOf(env, session.puuid)) ?? uid;
  const id = await fingerprint(
    env,
    'delivery',
    JSON.stringify([acct, rotation, channel, destination.to]),
  );
  const body =
    channel === 'discord'
      ? discordAlert(uid, session, found, left)
      : await build(env, uid, session, found, left);
  const queued = await deliveries.claim(
    env,
    id,
    await seal(env, id, CURRENT_KID, body, 'outbox:2'),
  );
  if (queued.state === 'done') return true;
  return queued.state === 'claimed' && dispatch(env, id, queued, budget);
}
