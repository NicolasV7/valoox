// Verifying a signed webhook.
//
// Its own module, and pure, for one reason: a verifier that has only ever been
// seen returning false is indistinguishable from a broken one. Everything here
// takes strings and returns a boolean, so a test can hold it to Svix's own
// published vector — see test/unit/svix.test.ts — and the route is left with
// nothing to get wrong but which headers to read.
//
// The scheme: HMAC-SHA256 over `id.timestamp.body`, keyed with the bytes after
// `whsec_`, base64 of the digest compared against one of the space-separated
// `v1,<sig>` values. More than one can be present while a secret is rotating,
// which is why it is a loop and not an equality.

/** Svix refuses anything older than this and so do we: a replayed delivery
 *  with a valid signature is still a replay. */
const SKEW = 5 * 60 * 1000;

const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

/** Constant time over two base64 strings. Length is compared first because it
 *  is not secret, and comparing different lengths byte-wise would read off the
 *  end of one of them. */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface Signed {
  secret: string | undefined;
  id: string | null;
  stamp: string | null;
  sigs: string | null;
  body: string;
  /** Injected so a test can pin the clock against a fixed vector. */
  now?: number;
}

/** True only when every part is present, recent and signs to one of the given
 *  signatures. A missing secret is false, which is how a verifier should fail. */
export async function verify({ secret, id, stamp, sigs, body, now }: Signed): Promise<boolean> {
  if (!secret || !id || !stamp || !sigs) return false;

  const when = Number(stamp) * 1000;
  if (!Number.isFinite(when)) return false;
  if (Math.abs((now ?? Date.now()) - when) > SKEW) return false;

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      'raw',
      unb64(secret.replace(/^whsec_/, '')),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  } catch {
    // A secret that is not base64 is a misconfiguration, not a caller's doing.
    return false;
  }

  const mine = b64(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id + '.' + stamp + '.' + body)),
  );

  for (const part of sigs.split(' ')) {
    const [version, sig] = part.split(',');
    if (version === 'v1' && sig && same(sig, mine)) return true;
  }
  return false;
}
