// What the provider says happened after it took the message.
//
// This is the only route in the app that is not a browser talking to us, so it
// is the only one that does not go past the same-origin check — a check that
// would reject it, correctly, because Resend is not this origin. What replaces
// it is a signature: Resend signs every delivery with Svix, and a request that
// does not verify is dropped before anything is read out of it.
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

import type { Env } from '../types.ts';
import { readSession, saveSession } from '../vault/session.ts';
import { trail } from './channel.ts';

/** Svix refuses anything older than this, and so do we: a replayed delivery
 *  with a valid signature is still a replay. */
const SKEW = 5 * 60 * 1000;

const bytes = (s: string) => new TextEncoder().encode(s);

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/**
 * Svix's scheme: HMAC-SHA256 over `id.timestamp.body` with the secret after
 * `whsec_`, base64 of the digest compared against one of the space-separated
 * `v1,<sig>` values in svix-signature.
 *
 * More than one signature can be present during a secret rotation, which is
 * why this is a loop and not an equality.
 */
async function signed(env: Env, req: Request, raw: string): Promise<boolean> {
  const secret = env.RESEND_HOOK;
  const id = req.headers.get('svix-id');
  const stamp = req.headers.get('svix-timestamp');
  const sigs = req.headers.get('svix-signature');
  if (!secret || !id || !stamp || !sigs) return false;

  const when = Number(stamp) * 1000;
  if (!Number.isFinite(when) || Math.abs(Date.now() - when) > SKEW) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    unb64(secret.replace(/^whsec_/, '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mine = b64(await crypto.subtle.sign('HMAC', key, bytes(id + '.' + stamp + '.' + raw)));

  for (const part of sigs.split(' ')) {
    const [version, sig] = part.split(',');
    if (version === 'v1' && sig && same(sig, mine)) return true;
  }
  return false;
}

/** Constant time over two base64 strings of the same length. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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
  if (!(await signed(env, req, raw))) return new Response(null, { status: 401 });

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
