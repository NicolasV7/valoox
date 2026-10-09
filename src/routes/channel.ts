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

import { tzOf } from '../alerts/mail/clock.ts';
import { langOf } from '../alerts/mail/words.ts';
import { check, left, waitFor } from '../alerts/otp.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import { gotThere, looksLikeAddress, refused } from '../vault/mail.ts';
import { readSession, saveSession } from '../vault/session.ts';
import { mail } from './send.ts';

/**
 * Set the address and send it a code.
 *
 * The address is validated, stored unverified, and then mailed — in that
 * order, so what reaches fetch() is a value this Worker put in its own row
 * rather than a string off a request.
 *
 * Changing it stops the alerts until the new code comes back: there is one
 * address and `ok` goes false with it, and both the job and post() gate on
 * `ok === true`. A doc comment here used to claim the old address kept
 * receiving in the meantime, and the alerts copy was written from that
 * sentence rather than from the code.
 */
export async function setChannel({ env, uid, req }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;

  const body = (await req.json().catch(() => null)) as {
    to?: unknown;
    lang?: unknown;
    tz?: unknown;
  } | null;
  const to = typeof body?.to === 'string' ? body.to.trim() : '';
  // The language of the tab that asked, so the mail arrives in the language of
  // the screen that sent it. Kept on the row so the morning message matches.
  const lang = langOf(body?.lang);
  const tz = tzOf(body?.tz);
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

  // The address too, so one session cannot mail a different stranger every
  // minute — see toGate() in alerts/otp.ts.
  const wait = await waitFor(env, uid, to);
  if (wait > 0) return { error: 'wait', wait };
  // Re-sending to an address already proved must not un-prove it: the code is
  // how you change an address, not how you keep one.
  const keep = was?.ok === true && was.to === to;
  // tz included. mail() has taken it since the header grew a clock, and
  // neither caller passed it — so `expiresAt` fell to its no-offset branch in
  // every message production has ever sent, and `npm run mail` previewed a
  // header nobody could receive.
  const { sent, until } = await mail(
    env,
    uid,
    to,
    lang,
    new URL(req.url).origin,
    held.session.name,
    tz,
  );

  held.session.mail = {
    to,
    lang,
    ...(tz === undefined ? {} : { tz }),
    ok: keep,
    ...(sent.id ? { send: sent.id } : {}),
    said: sent.said,
  };
  // A lost CAS here left the row on the OLD address while a code for the new
  // one was already in a mailbox. The code is bound to its destination now, so
  // it cannot verify the wrong address — but the screen should still not claim
  // the change landed when it did not.
  if (!(await saveSession(env, uid, held.session, held.ver))) {
    return { ok: false, error: 'conflict' };
  }

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

  const wait = await waitFor(env, uid, to);
  if (wait > 0) return { error: 'wait', wait };

  const body = (await req.json().catch(() => null)) as { lang?: unknown; tz?: unknown } | null;
  const lang = langOf(body?.lang ?? held.session.mail?.lang);
  const tz = tzOf(body?.tz) ?? held.session.mail?.tz;
  const { sent, until } = await mail(
    env,
    uid,
    to,
    lang,
    new URL(req.url).origin,
    held.session.name,
    tz,
  );
  held.session.mail = {
    ...held.session.mail,
    to,
    lang,
    ...(tz === undefined ? {} : { tz }),
    ok: held.session.mail?.ok === true,
    ...(sent.id ? { send: sent.id } : {}),
    said: sent.said,
  };
  if (!(await saveSession(env, uid, held.session, held.ver))) {
    return { ok: false, error: 'conflict' };
  }
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

  // One mailbox, as many accounts as somebody has. Two of them is a thing
  // people actually do — a main and a smurf, a sibling's account on the same
  // phone — and refusing the second was the app deciding how many accounts a
  // person is allowed. What it cost instead was a message you could not place,
  // so every message now carries the Riot name it is about.
  const to = held.session.mail.to;

  // The address is half of what the code proves, so it goes into the check.
  const verdict = await check(env, uid, to, code);
  if (verdict !== 'ok') return { error: verdict, left: await left(env, uid) };

  held.session.mail = { ...held.session.mail, ok: true };
  if (await saveSession(env, uid, held.session, held.ver)) return { ok: true, to };

  // Losing the compare-and-swap here cannot be answered with "try again":
  // check() deletes the code on success, so there is nothing left to type.
  // Re-read and set the flag on whatever won — unless it moved the address,
  // in which case this code proved a mailbox the row is no longer pointed at
  // and marking it verified is the one thing that must not happen.
  const again = await readSession(env, uid);
  if (!again) return RESEED;
  if (again.session.mail?.to !== to) return { error: 'address' };
  again.session.mail = { ...again.session.mail, ok: true };
  if (!(await saveSession(env, uid, again.session, again.ver))) {
    return { ok: false, error: 'conflict' };
  }
  return { ok: true, to };
}
