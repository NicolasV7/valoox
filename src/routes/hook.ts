// What the provider says happened after it took the message.
//
// This is the only route in the app that is not a browser talking to us, so it
// is the only one that does not go past the same-origin check — a check that
// would reject it, correctly, because Resend is not this origin. What replaces
// it is a signature: Resend signs every delivery with Svix, and a request that
// does not verify is dropped before anything is read out of it. The maths of
// that lives in alerts/svix.ts, where a test can hold it to Svix's own vector.
//
// It exists to answer one question the send itself cannot: did the receiving
// server take it. A 2xx from the API means Resend accepted the message. A
// `bounced` event means the far end refused it, which is the one case where
// telling somebody to try again is wrong — the address has to change. That is
// the whole reason this route is here.
//
// `delivered` is still the provider's word for "the receiving server accepted
// it", not for "a person read it", and the status is stored as the provider's
// own event name so no screen can quietly upgrade it.

import { verify } from '../alerts/svix.ts';
import type { Env } from '../types.ts';
import { readSession, saveSession } from '../vault/session.ts';
import { trail } from './channel.ts';

interface Event {
  type?: string;
  data?: { email_id?: string };
}

/**
 * Not a Ctx route: it answers Resend, not a browser, so it takes the raw
 * request and returns a Response. A failure is still a 2xx body-less answer
 * wherever the signature checked out — a provider that gets a 500 retries, and
 * retrying a delivery we already recorded is noise.
 */
export async function resendHook(req: Request, env: Env): Promise<Response> {
  const raw = await req.text();
  const ok = await verify({
    secret: env.RESEND_HOOK,
    id: req.headers.get('svix-id'),
    stamp: req.headers.get('svix-timestamp'),
    sigs: req.headers.get('svix-signature'),
    body: raw,
  });
  if (!ok) return new Response(null, { status: 401 });

  const event = JSON.parse(raw) as Event;
  const id = event.data?.email_id;
  const kind = event.type;
  if (!id || !kind) return new Response(null, { status: 204 });

  const uid = await env.VAL.get(trail(id));
  if (!uid) return new Response(null, { status: 204 });

  const held = await readSession(env, uid);
  // Only the message we last sent for this browser. A late event about an
  // address that has since been changed must not relabel the new one.
  if (!held?.session.mail || held.session.mail.send !== id) {
    return new Response(null, { status: 204 });
  }

  // The provider's own event name, stored as theirs. A bounce also drops the
  // proof: an address that refused the code never carried one back, and
  // leaving it verified would keep the morning message pointed at a wall.
  const dead = kind === 'email.bounced' || kind === 'email.complained';
  held.session.mail = {
    ...held.session.mail,
    said: kind,
    ok: dead ? false : held.session.mail.ok,
  };
  await saveSession(env, uid, held.session, held.ver);

  console.log('hook ' + kind);
  return new Response(null, { status: 204 });
}
