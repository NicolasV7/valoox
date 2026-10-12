import type { Env } from '../types.ts';

export const enc = new TextEncoder();
export const dec = new TextDecoder();

export function bytes(raw: string): Uint8Array<ArrayBuffer> {
  try {
    return Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  } catch {
    return new Uint8Array();
  }
}
export const b64 = (raw: Uint8Array) => btoa(String.fromCharCode(...raw));
export const hex = (raw: Uint8Array) =>
  [...raw].map((b) => b.toString(16).padStart(2, '0')).join('');

let root: { raw: string; key: Promise<CryptoKey> } | undefined;

function material(env: Env): Promise<CryptoKey> {
  if (root?.raw !== env.JAR_KEY) {
    const raw = bytes(env.JAR_KEY ?? '');
    if (raw.length !== 32) throw new Error('sealing key must decode to 32 bytes');
    root = {
      raw: env.JAR_KEY,
      key: crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey']),
    };
  }
  return root.key;
}

export async function derive(
  env: Env,
  info: string,
  salt = 'valoox:v2',
  hmac = false,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(salt), info: enc.encode(info) },
    await material(env),
    hmac ? { name: 'HMAC', hash: 'SHA-256', length: 256 } : { name: 'AES-GCM', length: 256 },
    false,
    hmac ? ['sign'] : ['encrypt', 'decrypt'],
  );
}

/** Keyed identifiers are not bearer credentials and cannot be guessed offline. */
export async function fingerprint(env: Env, purpose: string, value: string): Promise<string> {
  const key = await derive(env, 'fingerprint:' + purpose, undefined, true);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value))));
}
export const browserId = (env: Env, secret: string) => fingerprint(env, 'browser', secret);
