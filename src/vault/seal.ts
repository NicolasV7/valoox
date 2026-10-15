import type { Env } from '../types.ts';
import { b64, bytes, dec, derive, enc } from './keys.ts';

// Schema and purpose bind the key and authenticated data. Moving a session
// into a cache, or a cache into a scan, must never open successfully.
export const CURRENT_KID = 2;
export type Purpose =
  | 'session:2'
  | 'store:4'
  | 'inv:3'
  | 'scan:2'
  | 'stop:2'
  | 'outbox:2'
  | 'wishlist:1';
const aad = (uid: string, kid: number, purpose: Purpose) =>
  enc.encode(JSON.stringify([kid, purpose, uid]));
const key = (env: Env, uid: string, kid: number, purpose: Purpose) =>
  derive(env, JSON.stringify([purpose, uid]), 'kid:' + kid);

export class SealBroken extends Error {
  constructor() {
    super('sealed blob did not open');
    this.name = 'SealBroken';
  }
}

export async function seal(
  env: Env,
  uid: string,
  kid: number,
  data: unknown,
  purpose: Purpose = 'session:2',
): Promise<string> {
  if (kid !== CURRENT_KID) throw new SealBroken();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad(uid, kid, purpose) },
    await key(env, uid, kid, purpose),
    enc.encode(JSON.stringify(data)),
  );
  const raw = new Uint8Array(12 + ct.byteLength);
  raw.set(iv);
  raw.set(new Uint8Array(ct), 12);
  return b64(raw);
}

export async function open<T>(
  env: Env,
  uid: string,
  kid: number,
  blob: string,
  purpose: Purpose = 'session:2',
): Promise<T> {
  try {
    if (kid !== CURRENT_KID) throw new SealBroken();
    const raw = bytes(blob);
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: raw.subarray(0, 12), additionalData: aad(uid, kid, purpose) },
      await key(env, uid, kid, purpose),
      raw.subarray(12),
    );
    return JSON.parse(dec.decode(pt)) as T;
  } catch {
    throw new SealBroken();
  }
}

/** Only QR preference adoption calls this, after Riot confirms the account. */
export async function openLegacy<T>(env: Env, uid: string, blob: string): Promise<T> {
  try {
    const raw = bytes(blob);
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: raw.subarray(0, 12), additionalData: enc.encode('1|' + uid) },
      await derive(env, 'jar:' + uid, 'kid:1'),
      raw.subarray(12),
    );
    return JSON.parse(dec.decode(pt)) as T;
  } catch {
    throw new SealBroken();
  }
}
