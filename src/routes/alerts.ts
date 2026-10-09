import { langOf, words } from '../alerts/mail/words.ts';
import { deliver } from '../alerts/post.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import { readSession } from '../vault/session.ts';

/**
 * Sends one now.
 *
 * Whether it reaches a phone is not observable from here, and this is the only
 * honest answer: send one and let the phone be the proof. What comes back is
 * the status the channel returned, never a claim that it was delivered — a
 * server cannot see an inbox.
 */
export async function testAlert({ env, uid }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  // In the language the row asked for. It carries no skin, no account id and
  // no session, so if it leaked it would say only that this channel works —
  // see `pushTest` in alerts/mail/words.ts, which is where it is written.
  const lang = langOf(held.session.mail?.lang);
  const via = await deliver(held.session.notify ?? {}, words[lang].pushTest);
  return { ok: true, via };
}
