// The token in the footer of every message.
//
// A link that turns alerts off has to work from a phone that has never had
// this app's cookie: the mail is read wherever mail is read. So the row it
// acts on travels in the link itself — and that is the whole difficulty,
// because the name of the row IS the session cookie. There is one identifier
// in this app and `uid` is it.
//
// It used to travel in the clear, signed: `<uid>.<nonce>.<hmac>`. The
// signature answered the question the module was thinking about — nobody can
// forge a link for a row they do not know — and missed the one it was not:
// anyone who READS the message gets a working `Cookie: uid=…` for an account
// whose storefront, collection, wallet and alert address are one GET away.
// Resend keeps the rendered html of everything it sends, mail gets forwarded,
// screenshotted and scanned, and `HttpOnly` protects none of that.
//
// So the body is encrypted rather than signed. AES-256-GCM under a key
// derived from JAR_KEY with an info string of its own, which keeps every
// property the signed version had and drops the disclosure:
//
//   · unforgeable — GCM's tag is the signature, and verifying it is constant
//     time by construction rather than by a loop somebody has to get right
//   · opaque — the link names nobody. It is ciphertext to everyone but this
//     Worker, including to whatever handled the mail on the way
//   · bounded by the kill switch — a rotated JAR_KEY voids every outstanding
//     link at the same moment it voids every session, which is correct,
//     because after a rotation there is no row left for one to act on
//   · stateless — nothing is written at mint time, so there is no KV record
//     to go stale and no window where a freshly sent link does not work yet
//
// It is not a login, and now the shape says so as well as the comment did.
// All it carries is permission to stop sending, and the mail it rides in was
// already in that mailbox.
//
// Each one is minted with a nonce of its own, so every message carries a
// different link. That is what lets a link be spent: answering one closes
// that link and leaves every other message's alone — without the nonce,
// burning one would burn the whole account's, including the ones in mail
// that has not been opened yet.

import type { Env } from '../types.ts';

const enc = new TextEncoder();
const dec = new TextDecoder();

const b64u = (u: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const unb64u = (s: string): Uint8Array => {
  const raw = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const u = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) u[i] = raw.charCodeAt(i);
  return u;
};

let cache: { raw: string; key: Promise<CryptoKey> } | null = null;

/** Keyed on the secret itself, so a rotation takes effect in the same request
 *  rather than whenever a warm isolate happens to be recycled — the same
 *  reasoning as `kek()` in seal.ts, for the same reason: the rotation is the
 *  kill switch and a kill switch with a lag is not one.
 *
 *  `info` differs from the jar's, so this key opens no session and a sealed
 *  session is not a token. JAR_KEY is standard base64 and `unb64u` leaves
 *  that untouched — it only rewrites the two url-safe characters. */
function sealer(env: Env): Promise<CryptoKey> {
  if (cache?.raw !== env.JAR_KEY) {
    cache = {
      raw: env.JAR_KEY,
      key: crypto.subtle
        .importKey('raw', unb64u(env.JAR_KEY), 'HKDF', false, ['deriveKey'])
        .then((root) =>
          crypto.subtle.deriveKey(
            {
              name: 'HKDF',
              hash: 'SHA-256',
              salt: enc.encode('stop'),
              info: enc.encode('stop:link'),
            },
            root,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'],
          ),
        ),
    };
  }
  return cache.key;
}

/** Which message this link came in. Random rather than a counter: a counter
 *  would say how many have been sent, in a string that travels in a mailbox. */
const nonce = () => b64u(crypto.getRandomValues(new Uint8Array(9)));

export interface Stop {
  uid: string;
  /** The one message this link belongs to, and the thing that gets spent. */
  id: string;
}

/** `<iv><ciphertext><tag>`, url-safe base64 — about a hundred characters that
 *  say nothing to anyone holding them. */
export async function mintStop(env: Env, uid: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      await sealer(env),
      enc.encode(uid + '.' + nonce()),
    ),
  );
  const out = new Uint8Array(12 + ct.length);
  out.set(iv);
  out.set(ct, 12);
  return b64u(out);
}

/** What a token names, or null. Everything that is not a token this Worker
 *  minted under the current key lands in the same place — a bad tag, a wrong
 *  key, a truncated string, something that is not base64 at all. */
export async function readStop(env: Env, token: unknown): Promise<Stop | null> {
  if (typeof token !== 'string' || token.length < 24 || token.length > 256) return null;
  try {
    const raw = unb64u(token);
    // Twelve of iv and sixteen of tag, so anything this short carries no body.
    if (raw.length <= 28) return null;
    const body = dec.decode(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: raw.subarray(0, 12) },
        await sealer(env),
        raw.subarray(12),
      ),
    );
    const dot = body.indexOf('.');
    return dot > 0 ? { uid: body.slice(0, dot), id: body.slice(dot + 1) } : null;
  } catch {
    return null;
  }
}

/**
 * Whether this link has already been answered.
 *
 * Six months, because a message is read whenever it is read and a link that
 * quietly came back to life would be the same surprise it was built to
 * avoid. Not atomic, and it does not need to be: two taps on one link in the
 * same second is somebody double-tapping, and both would do the same thing.
 */
const SPENT = 60 * 60 * 24 * 180;

export const wasSpent = async (env: Env, id: string): Promise<boolean> =>
  (await env.VAL.get('stop:' + id)) !== null;

export const spend = (env: Env, id: string, how: string): Promise<void> =>
  env.VAL.put('stop:' + id, how, { expirationTtl: SPENT });
