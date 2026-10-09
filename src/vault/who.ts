// The same account, counted without being named.
//
// `npm run who` counts rows, and a row is a BROWSER: a phone and a laptop are
// two, every private window is another, and a fresh sign-in after a prune is
// one more. So the honest answer to "how many people" was "fewer than this,
// and nothing here can say how many fewer".
//
// The puuid would answer it exactly and must not be a column: schema.sql's
// claim is that a raw table dump reveals no Riot identity, and that claim is
// the reason the puuid lives sealed inside the blob.
//
// So the column holds a MARK instead — HMAC-SHA256 of the puuid under a key
// derived from JAR_KEY, truncated. What that buys, precisely:
//
//   · COUNT(DISTINCT acct) is exact. Two browsers of one account collapse.
//   · the mark is not the puuid and does not contain it. Going backwards means
//     guessing a puuid AND holding JAR_KEY, which is not in the database.
//   · a rotation changes every mark — and deletes every row on first touch
//     anyway, so the count restarts with the rows rather than double-counting.
//
// What it costs, said plainly rather than left out: a dump now shows that two
// rows belong to one account. Not which account. That is the whole of the
// trade, and it is the minimum that answers the question.

import type { Env } from '../types.ts';

const enc = new TextEncoder();

let cache: { raw: string; key: Promise<CryptoKey> } | null = null;

/** Keyed on the secret itself, so a rotation takes effect in the same request
 *  rather than whenever a warm isolate happens to be recycled. */
function signer(env: Env): Promise<CryptoKey> {
  if (cache?.raw !== env.JAR_KEY) {
    cache = {
      raw: env.JAR_KEY,
      key: crypto.subtle.importKey(
        'raw',
        enc.encode('who:' + env.JAR_KEY),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      ),
    };
  }
  return cache.key;
}

/** The mark for one account, or null when the session has no puuid yet — a
 *  sign-in that stored the jar and died before identify is a real state, and
 *  it heals on the next request through live.ts. */
export async function markOf(env: Env, puuid?: string): Promise<string | null> {
  if (!puuid) return null;
  const sig = await crypto.subtle.sign('HMAC', await signer(env), enc.encode(puuid));
  return [...new Uint8Array(sig).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
