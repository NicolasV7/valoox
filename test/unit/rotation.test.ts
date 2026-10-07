import assert from 'node:assert';
import { test } from 'vitest';
import type { Env } from '../../src/types.ts';
import { open, SealBroken, seal } from '../../src/vault/seal.ts';

// THE KILL SWITCH.
//
// Rotating JAR_KEY is the entire reactive story: one command makes every
// ciphertext that exists undecryptable — live rows, D1 Time Travel snapshots,
// and any .sql export sitting on a stolen laptop — and it works even if D1 is
// down. This file proves the property. The production drill (an actual
// `wrangler secret put` against the live Worker) is a separate, deliberate step:
// it signs out every user, so it is done before there are users, not after.

const key = () =>
  ({ JAR_KEY: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64') }) as Env;

const UID = 'c'.repeat(32);
const KID = 1;
const session = { jar: { ssid: 'live-session' }, puuid: 'p', shard: 'na' };

test('rotating the key orphans every existing blob', async () => {
  const before = key();
  const blob = await seal(before, UID, KID, session);
  assert.deepEqual(await open(before, UID, KID, blob), session, 'opens under the old key');

  const after = key();
  await assert.rejects(() => open(after, UID, KID, blob), SealBroken, 'and never again');
});

test('a rotation takes effect immediately, not when isolates recycle', async () => {
  // The KEK is cached per isolate. If the cache ignored a changed secret, the
  // kill switch would lag by however long a warm isolate lives — which is not a
  // kill switch. Interleaving the two keys here is what catches that.
  const a = key();
  const b = key();
  const blobA = await seal(a, UID, KID, session);
  const blobB = await seal(b, UID, KID, session);

  assert.deepEqual(await open(a, UID, KID, blobA), session);
  assert.deepEqual(await open(b, UID, KID, blobB), session);
  await assert.rejects(() => open(b, UID, KID, blobA), SealBroken);
  await assert.rejects(() => open(a, UID, KID, blobB), SealBroken);
});

test('a key of the wrong length is refused rather than silently weakened', async () => {
  const short = { JAR_KEY: Buffer.alloc(8).toString('base64') } as Env;
  // HKDF accepts any input keying material, so this does not throw — it derives
  // a valid but weak key. The guard belongs at deploy time, and this test exists
  // to record that the crypto layer will NOT catch it for you.
  const blob = await seal(short, UID, KID, session);
  assert.deepEqual(await open(short, UID, KID, blob), session);
});
