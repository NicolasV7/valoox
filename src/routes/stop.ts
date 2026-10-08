// Stopping the mail, from the mail.
//
// What it does and what it leaves alone are the whole design. The address
// goes — not flagged, removed — and the claim on it is released, so it is
// free the moment somebody wants it back, here or on another account. The
// wishlist is untouched: what you starred is taste, and throwing it away
// because a mailbox got noisy would be answering a different request.
//
// So the row stays, with nowhere to send. The daily job skips it, because
// `setAlerts(false)` is exactly the flag it polls on, and nothing runs until
// an address is put back.
//
// Not a GET. A link in a mail is followed by scanners before a person sees
// it, and an unsubscribe that a scanner can fire is an unsubscribe nobody
// asked for — the same reason the code is six digits and not a link. The page
// behind the link posts this itself, which a scanner does not do.

import { release } from '../alerts/claim.ts';
import type { Body, Ctx } from '../lib/json.ts';
import type { Env } from '../types.ts';
import { setAlerts } from '../vault/repo.ts';
import { readSession, saveSession } from '../vault/session.ts';
import { readStop } from '../vault/stop.ts';

export async function stopMail({ env, uid, req }: Ctx): Promise<Body> {
  const body = (await req.json().catch(() => null)) as { t?: unknown } | null;

  // No token at all is the other door: the Account screen, on the device that
  // is already signed in, where the cookie is the answer.
  if (body?.t === undefined || body.t === '') return off(env, uid);

  // A token that was offered and does not verify is refused rather than
  // quietly ignored. Falling back to the cookie here would mean a link with
  // garbage in it turns off the alerts of whoever happens to open it — the
  // signature would be decoration, and the link would be the attack.
  const who = await readStop(env, body.t);
  if (!who) return { ok: false, error: 'bad link' };
  return off(env, who);
}

async function off(env: Env, uid: string, retry = true): Promise<Body> {
  const held = await readSession(env, uid);
  // Nothing to stop is the same answer as stopped. A link followed twice, or
  // after the session expired, should read as done rather than as a failure.
  if (!held) return { ok: true, was: null };

  const was = held.session.mail?.to ?? null;
  if (!was) return { ok: true, was: null, kept: held.session.wishlist?.length ?? 0 };

  held.session.mail = undefined;
  if (!(await saveSession(env, uid, held.session, held.ver))) {
    if (retry) return off(env, uid, false);
    return { ok: false, error: 'conflict' };
  }
  // In this order: the row stops being polled before the address is free, so
  // there is no window where the job could pick it up with nowhere to send.
  await setAlerts(env, uid, false);
  await release(env, was, uid);

  return { ok: true, was, kept: held.session.wishlist?.length ?? 0 };
}

/** The link in a footer. One shape, built in one place, because two spellings
 *  of it is how one of them stops working without anybody noticing. */
export const stopLink = (origin: string, token: string): string =>
  origin + '/stop?t=' + encodeURIComponent(token);
