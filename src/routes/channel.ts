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

import { claim, heldBy, release } from '../alerts/claim.ts';
import { html, subject, text } from '../alerts/mail/code.ts';
import { type Lang, langOf } from '../alerts/mail/words.ts';
import { check, clear, LIFE, left, mint, waitFor } from '../alerts/otp.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import type { Env } from '../types.ts';
import { gotThere, looksLikeAddress, refused, send } from '../vault/mail.ts';
import * as repo from '../vault/repo.ts';
import { readSession, saveSession } from '../vault/session.ts';

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
  origin.startsWith('https://') ? origin : 'https://valoox.store';

async function mail(env: Env, uid: string, to: string, lang: Lang, origin: string) {
  const { code, until } = await mint(env, uid);
  const sent = await send(
    env,
    to,
    subject(code, lang),
    html(code, LIFE.minutes, lang, artFrom(origin)),
    text(code, LIFE.minutes, lang),
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

  const body = (await req.json().catch(() => null)) as { to?: unknown; lang?: unknown } | null;
  const to = typeof body?.to === 'string' ? body.to.trim() : '';
  // The language of the tab that asked, so the mail arrives in the language of
  // the screen that sent it. Kept on the row so the morning message matches.
  const lang = langOf(body?.lang);
  if (!looksLikeAddress(to)) return { error: 'address' };

  const was = held.session.mail;
  // Asked before the cooldown, because it is the more useful answer: telling
  // somebody to wait thirty seconds points them back at a button that will
  // never work. The same address that bounced is the one send that cannot
  // work; a different one is always allowed, and changing it is the way out.
  if (was?.to === to && refused(was.said)) return { error: 'bounced', said: was.said };
  // It arrived and there is still a live code in it, so another one would be
  // a second code for a message already in a mailbox. Bounded by the ten
  // minutes: once the code dies this lifts on its own.
  if (was?.to === to && gotThere(was.said) && (await left(env, uid)) !== null) {
    return { error: 'opened', said: was.said };
  }

  const wait = await waitFor(env, uid);
  if (wait > 0) return { error: 'wait', wait };
  // Re-sending to an address already proved must not un-prove it: the code is
  // how you change an address, not how you keep one.
  const keep = was?.ok === true && was.to === to;
  const { sent, until } = await mail(env, uid, to, lang, new URL(req.url).origin);

  held.session.mail = {
    to,
    lang,
    ok: keep,
    ...(sent.id ? { send: sent.id } : {}),
    said: sent.said,
  };
  await saveSession(env, uid, held.session, held.ver);

  return { to, ok: keep, said: sent.said, status: sent.status, until, sent: sent.ok };
}

/** Another code for the address already stored. Same cooldown, same ceiling. */
export async function resend({ env, uid, req }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const to = held.session.mail?.to;
  if (!to) return { error: 'address' };

  // Same rule as setChannel and in the same order, and it has to live here
  // too: this route takes no address, so without it "send it again" is a way
  // around the block.
  if (refused(held.session.mail?.said)) {
    return { error: 'bounced', said: held.session.mail?.said };
  }
  if (gotThere(held.session.mail?.said) && (await left(env, uid)) !== null) {
    return { error: 'opened', said: held.session.mail?.said };
  }

  const wait = await waitFor(env, uid);
  if (wait > 0) return { error: 'wait', wait };

  const body = (await req.json().catch(() => null)) as { lang?: unknown } | null;
  const lang = langOf(body?.lang ?? held.session.mail?.lang);
  const { sent, until } = await mail(env, uid, to, lang, new URL(req.url).origin);
  held.session.mail = {
    ...held.session.mail,
    to,
    lang,
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

  // The code was right, so this person holds the mailbox — which is the only
  // point at which it is safe to say whether somebody else already does. See
  // alerts/claim.ts for why this is not checked at send time.
  const to = held.session.mail.to;
  const by = await heldBy(env, to);
  if (by && by !== uid) {
    // Unless that browser is gone. A pruned row must not hold an address
    // hostage: whoever can still read the mailbox should get it.
    if (await repo.get(env, by)) return { error: 'taken' };
  }

  // Letting go of the old one first, so changing address frees the previous.
  const was = held.session.mailWas;
  if (was && was !== to) await release(env, was, uid);
  await claim(env, to, uid);

  held.session.mail = { ...held.session.mail, ok: true };
  held.session.mailWas = to;
  await saveSession(env, uid, held.session, held.ver);
  return { ok: true, to };
}
