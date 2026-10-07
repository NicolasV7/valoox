import type { Env } from '../types.ts';

// What this buys, precisely — and it is worth writing down because the usual
// claim is wrong. Cloudflare already encrypts D1 at rest with its own AES-256
// keys, so "encrypted at rest" describes the platform, not this file.
//
// The ONLY thing sealing here buys is that the key lives OUTSIDE the database.
// Anything that reads rows — a leaked D1-scoped API token, a query bug, a log
// line, a Time Travel export, a .sql on a stolen laptop — gets ciphertext.
// That is the common, low-effort leak, and this turns it inert.
//
// What it does NOT buy: protection from anyone who can deploy a Worker. They
// read the key from env in two lines. That boundary is the Cloudflare account,
// not the crypto.

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Current key version. Bump when JAR_KEY is replaced; old rows keep their own
 *  kid and still open, so nobody is logged out by a rotation. */
export const CURRENT_KID = 1;

/** Derived once per isolate, not once per request. The promise is cached (not
 *  the resolved key) so concurrent requests in one isolate don't race — and it is
 *  keyed on the secret itself, so a rotated JAR_KEY takes effect immediately
 *  instead of waiting for every warm isolate to be recycled. That matters: the
 *  rotation IS the kill switch, and a kill switch with a lag is not one. */
let kekCache: { raw: string; key: Promise<CryptoKey> } | null = null;

function bytes(b64: string): Uint8Array {
  const s = atob(b64);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}

function b64(u: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

function kek(env: Env): Promise<CryptoKey> {
  if (kekCache?.raw !== env.JAR_KEY) {
    kekCache = {
      raw: env.JAR_KEY,
      key: crypto.subtle.importKey('raw', bytes(env.JAR_KEY), 'HKDF', false, ['deriveKey']),
    };
  }
  return kekCache.key;
}

/** Per-user subkey. HKDF rather than a stored per-user DEK: a wrapped DEK would
 *  live in the same table, with the same Time Travel history, unwrapped by the
 *  same KEK on every request — so it buys none of the three things an envelope
 *  is supposed to buy. This gives the key separation for free. */
async function userKey(env: Env, uid: string, kid: number): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: enc.encode('kid:' + kid),
      info: enc.encode('jar:' + uid),
    },
    await kek(env),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Binding kid|uid as additional authenticated data is the most valuable line in
 *  this file, and it is a correctness guard as much as a crypto one: a row mix-up
 *  fails CLOSED instead of quietly decrypting somebody else's session. */
const aad = (uid: string, kid: number) => enc.encode(kid + '|' + uid);

export async function seal(env: Env, uid: string, kid: number, data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad(uid, kid) },
    await userKey(env, uid, kid),
    enc.encode(JSON.stringify(data)),
  );
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv);
  out.set(new Uint8Array(ct), 12);
  return b64(out);
}

export class SealBroken extends Error {
  constructor() {
    super('sealed blob did not open');
    this.name = 'SealBroken';
  }
}

export async function open<T>(env: Env, uid: string, kid: number, blob: string): Promise<T> {
  try {
    const raw = bytes(blob);
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: raw.subarray(0, 12), additionalData: aad(uid, kid) },
      await userKey(env, uid, kid),
      raw.subarray(12),
    );
    return JSON.parse(dec.decode(pt)) as T;
  } catch {
    // Tampering, a wrong uid, a rotated key, or corruption. All the same to us:
    // the session is gone and the user signs in again. Never leak which.
    throw new SealBroken();
  }
}
