// The token in the footer of every message.
//
// A link that turns alerts off has to work from a phone that has never had
// this app's cookie: the mail is read wherever mail is read. So the row it
// acts on is named in the link itself, with a signature beside it — the uid
// alone would be a bearer token anybody could guess at, and a signed one is
// only ever good for the one thing this file is for.
//
// Derived from JAR_KEY with its own info string, which means two things worth
// stating. The link can do nothing a stored session can do: a different key
// opens nothing. And rotating JAR_KEY voids every outstanding link at the
// same moment it voids every session — which is correct, because after a
// rotation there is no row left for one to act on.
//
// It is not a login. All it carries is permission to stop sending, and the
// mail it rides in was already in that mailbox.
//
// Each one is minted with a nonce of its own, so every message carries a
// different link. That is what lets a link be spent: answering one closes
// that link and leaves every other message's alone — without the nonce,
// burning one would burn the whole account's, including the ones in mail
// that has not been opened yet.

import type { Env } from '../types.ts';

const enc = new TextEncoder();

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
 *  rather than whenever a warm isolate happens to be recycled. */
function signer(env: Env): Promise<CryptoKey> {
  if (cache?.raw !== env.JAR_KEY) {
    cache = {
      raw: env.JAR_KEY,
      key: crypto.subtle.importKey(
        'raw',
        enc.encode('stop:' + env.JAR_KEY),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      ),
    };
  }
  return cache.key;
}

const tag = async (env: Env, body: string): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.sign('HMAC', await signer(env), enc.encode(body))).slice(
    0,
    16,
  );

/** Which message this link came in. Random rather than a counter: a counter
 *  would say how many have been sent, in a string that travels in a mailbox. */
const nonce = () => b64u(crypto.getRandomValues(new Uint8Array(9)));

export interface Stop {
  uid: string;
  /** The one message this link belongs to, and the thing that gets spent. */
  id: string;
}

/** `<uid>.<nonce>.<signature>`, url-safe. */
export async function mintStop(env: Env, uid: string): Promise<string> {
  const id = nonce();
  return uid + '.' + id + '.' + b64u(await tag(env, uid + '.' + id));
}

/** What a token names, or null. Constant time on the comparison, because an
 *  early return on the first wrong byte is how a signature gets forged one
 *  byte at a time. */
export async function readStop(env: Env, token: unknown): Promise<Stop | null> {
  if (typeof token !== 'string' || token.length > 256) return null;
  const cut = token.lastIndexOf('.');
  if (cut <= 0) return null;

  const body = token.slice(0, cut);
  const dot = body.indexOf('.');
  if (dot <= 0) return null;

  const got = unb64u(token.slice(cut + 1));
  const want = await tag(env, body);
  if (got.length !== want.length) return null;

  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= got[i] ^ want[i];
  return diff === 0 ? { uid: body.slice(0, dot), id: body.slice(dot + 1) } : null;
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
