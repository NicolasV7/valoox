import * as deliveries from '../storage/deliveries.ts';
import type { Env, Hit, Session } from '../types.ts';
import type { Budget } from '../vault/budget.ts';
import { fingerprint } from '../vault/keys.ts';
import { CURRENT_KID, seal } from '../vault/seal.ts';
import { readSession } from '../vault/session.ts';
import { markOf } from '../vault/who.ts';
import { dispatch } from './dispatch.ts';
import { type Lang, words } from './mail/words.ts';
import { build } from './outbox.ts';

export { deliver } from './push.ts';
export const message = (found: Hit[], lang: Lang): string =>
  words[lang].pushLine(found.map((h) => h.name));

export async function post(
  env: Env,
  uid: string,
  session: Session,
  found: Hit[],
  left: number,
  budget?: Budget,
  rotation = new Date().toISOString().slice(0, 10),
): Promise<boolean> {
  const current = await readSession(env, uid);
  if (!current || current.session.puuid !== session.puuid) return false;
  const acct = (await markOf(env, session.puuid)) ?? uid;
  let complete = true;
  for (const channel of ['mail', 'discord'] as const) {
    const to =
      channel === 'mail'
        ? session.mail?.ok && session.mail.to.toLowerCase()
        : session.notify?.discord;
    if (!to) continue;
    if (
      channel === 'mail' &&
      (current.session.mail?.gen !== session.mail?.gen || !current.session.mail?.ok)
    )
      return false;
    if (channel === 'discord' && current.session.notify?.discord !== to) return false;
    const id = await fingerprint(env, 'delivery', JSON.stringify([acct, rotation, channel, to]));
    const body = await build(env, uid, session, channel, found, left);
    const queued = await deliveries.claim(
      env,
      id,
      await seal(env, id, CURRENT_KID, body, 'outbox:2'),
    );
    if (queued.state === 'done') continue;
    if (queued.state !== 'claimed') {
      complete = false;
      continue;
    }
    complete = (await dispatch(env, id, queued, budget)) && complete;
  }
  return complete;
}
