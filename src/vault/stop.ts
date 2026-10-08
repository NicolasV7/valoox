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

const tag = async (env: Env, uid: string): Promise<Uint8Array> =>
  new Uint8Array(await crypto.subtle.sign('HMAC', await signer(env), enc.encode(uid))).slice(0, 16);

/** `<uid>.<signature>`, url-safe. */
export async function mintStop(env: Env, uid: string): Promise<string> {
  return uid + '.' + b64u(await tag(env, uid));
}

/** The uid a token names, or null. Constant time on the comparison, because
 *  an early return on the first wrong byte is how a signature gets forged one
 *  byte at a time. */
export async function readStop(env: Env, token: unknown): Promise<string | null> {
  if (typeof token !== 'string' || token.length > 256) return null;
  const cut = token.lastIndexOf('.');
  if (cut <= 0) return null;

  const uid = token.slice(0, cut);
  const got = unb64u(token.slice(cut + 1));
  const want = await tag(env, uid);
  if (got.length !== want.length) return null;

  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= got[i] ^ want[i];
  return diff === 0 ? uid : null;
}
