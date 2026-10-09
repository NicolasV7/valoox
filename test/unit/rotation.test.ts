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
  // This test used to assert the opposite of its own name: HKDF takes input
  // keying material of any length, so eight bytes derived a valid weak key and
  // the body checked that it round-tripped. The comment deferred the guard to
  // deploy time; nothing at deploy time had one. It is in kek() now.
  for (const bad of [Buffer.alloc(8), Buffer.alloc(31), Buffer.alloc(33)]) {
    const wrong = { JAR_KEY: bad.toString('base64') } as Env;
    await assert.rejects(() => seal(wrong, UID, KID, session), /32 bytes/);
  }
  // And something that is not base64 at all reads as a length of zero rather
  // than throwing out of atob with a DOMException nobody is catching.
  await assert.rejects(
    () => seal({ JAR_KEY: 'not base64 !!' } as Env, UID, KID, session),
    /32 bytes/,
  );
});

test('a key of the right length is not refused', async () => {
  const good = { JAR_KEY: Buffer.alloc(32, 7).toString('base64') } as Env;
  assert.deepEqual(await open(good, UID, KID, await seal(good, UID, KID, session)), session);
});
