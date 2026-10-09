// Building the message that proves an address, and posting it.
//
// Split out of routes/channel.ts, which is about what a request is allowed to
// do: whether this browser may send, whether this address may be sent to,
// whether a code is already outstanding. This is the other half — minting the
// code, drawing the mail around it, and remembering which message it was so
// the webhook can find the row again.

import { html, subject, text } from '../alerts/mail/code.ts';
import type { Lang } from '../alerts/mail/words.ts';
import { clear, LIFE, mint } from '../alerts/otp.ts';
import type { Env } from '../types.ts';
import { send } from '../vault/mail.ts';
import { mintStop } from '../vault/stop.ts';
import { stopLink } from './stop.ts';

/** Ties the provider's id for a message back to the browser it was sent for,
 *  so its webhook can find the row. Kept out of D1 on purpose: it is a short-
 *  lived join key, not state, and KV expires it without a cron. */
const TRAIL = 60 * 60 * 24 * 7;
export const trail = (id: string) => 'sent:' + id;

/** Where the one picture in a message is served from.
 *
 *  The live origin, except in dev: a mail client has no way to reach
 *  127.0.0.1, so a test message would arrive with a broken sticker and no way
 *  to tell that from a real one. Anything that is not https falls back to the
 *  address the app actually answers on. */
const artFrom = (origin: string) =>
  origin.startsWith('https://') ? origin : 'https://drop.valoox.store';

export async function mail(
  env: Env,
  uid: string,
  to: string,
  lang: Lang,
  origin: string,
  who?: string | null,
  tz?: number,
) {
  // The destination is part of what the code proves — see digest() in otp.ts.
  const { code, until } = await mint(env, uid, to);
  const home = artFrom(origin);
  const stop = stopLink(home, await mintStop(env, uid));
  const sent = await send(
    env,
    to,
    subject(code, lang),
    html(code, LIFE.minutes, lang, home, stop, who, tz),
    text(code, LIFE.minutes, lang),
  );
  // Nothing carried it, so nothing should be outstanding: the code is thrown
  // away and the cooldown with it, or a provider hiccup locks the button for a
  // minute over a message that never left.
  if (!sent.ok) await clear(env, uid, to);
  else if (sent.id) await env.VAL.put(trail(sent.id), uid, { expirationTtl: TRAIL });
  return { sent, until };
}
