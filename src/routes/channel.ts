// Where an alert goes, and proving the address can receive it.
//
// The test and the proof are the same action, which is the whole design: a
// notifier that will mail any address on request is a spam cannon with
// somebody else's return label on it. So there is one button, it sends a
// six-digit code, and nothing else is ever sent to an address until that code
// has been typed back.
//
// Why a code and not a link: a link in a mail is clicked by scanners before a
// person sees it, which would verify an address nobody read. A code has to be
// carried back by hand.
//
// What goes back to the browser is the provider's own status and nothing else.
// A 2xx means Resend accepted the message. It does not mean an inbox has it,
// and no field here says otherwise.

import { html, subject, text } from '../alerts/mail/code.ts';
import { check, clear, LIFE, left, mint, waitFor } from '../alerts/otp.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import type { Env } from '../types.ts';
import { looksLikeAddress, send } from '../vault/mail.ts';
import { readSession, saveSession } from '../vault/session.ts';

/** Ties the provider's id for a message back to the browser it was sent for,
 *  so its webhook can find the row. Kept out of D1 on purpose: it is a short-
 *  lived join key, not state, and KV expires it without a cron. */
const TRAIL = 60 * 60 * 24 * 7;
export const trail = (id: string) => 'sent:' + id;

/** mm:ss in the sender's own clock, for the one line the mail puts beside the
 *  mark. Nothing is promised about the reader's timezone, so it is a duration
 *  rendered as a time of day only where the mail itself computes it. */
const at = (ms: number) => new Date(ms).toISOString().slice(11, 16);

async function mail(env: Env, uid: string, to: string) {
  const { code, until } = await mint(env, uid);
  const sent = await send(
    env,
    to,
    subject(code),
    html(code, LIFE.minutes, at(until)),
    text(code, LIFE.minutes),
  );
  // Nothing carried it, so nothing should be outstanding: the code is thrown
  // away and the cooldown with it, or a provider hiccup locks the button for a
  // minute over a message that never left.
  if (!sent.ok) await clear(env, uid);
  else if (sent.id) await env.VAL.put(trail(sent.id), uid, { expirationTtl: TRAIL });
  return { sent, until };
}

/**
 * Set the address and send it a code.
 *
 * The address is validated, stored unverified, and then mailed — in that
 * order, so what reaches fetch() is a value this Worker put in its own row
 * rather than a string off a request. Changing it later starts the new one
 * unverified and leaves the old one receiving until the new code comes back,
 * so nothing stops silently.
 */
export async function setChannel({ env, uid, req }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;

  const body = (await req.json().catch(() => null)) as { to?: unknown } | null;
  const to = typeof body?.to === 'string' ? body.to.trim() : '';
  if (!looksLikeAddress(to)) return { error: 'address' };

  const wait = await waitFor(env, uid);
  if (wait > 0) return { error: 'wait', wait };

  const was = held.session.mail;
  // Re-sending to an address already proved must not un-prove it: the code is
  // how you change an address, not how you keep one.
  const keep = was?.ok === true && was.to === to;
  const { sent, until } = await mail(env, uid, to);

  held.session.mail = {
    to,
    ok: keep,
    ...(sent.id ? { send: sent.id } : {}),
    said: sent.said,
  };
  await saveSession(env, uid, held.session, held.ver);

  return { to, ok: keep, said: sent.said, status: sent.status, until, sent: sent.ok };
}

/** Another code for the address already stored. Same cooldown, same ceiling. */
export async function resend({ env, uid }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const to = held.session.mail?.to;
  if (!to) return { error: 'address' };

  const wait = await waitFor(env, uid);
  if (wait > 0) return { error: 'wait', wait };

  const { sent, until } = await mail(env, uid, to);
  held.session.mail = {
    ...held.session.mail,
    to,
    ok: held.session.mail?.ok === true,
    ...(sent.id ? { send: sent.id } : {}),
    said: sent.said,
  };
  await saveSession(env, uid, held.session, held.ver);
  return { to, said: sent.said, status: sent.status, until, sent: sent.ok };
}

/** The code, typed back. */
export async function verify({ env, uid, req }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  if (!held.session.mail?.to) return { error: 'address' };

  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (code.length !== 6) return { error: 'wrong', left: await left(env, uid) };

  const verdict = await check(env, uid, code);
  if (verdict !== 'ok') return { error: verdict, left: await left(env, uid) };

  held.session.mail = { ...held.session.mail, ok: true };
  await saveSession(env, uid, held.session, held.ver);
  return { ok: true, to: held.session.mail.to };
}
