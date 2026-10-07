import { test } from 'node:test';
import assert from 'node:assert';
import type { Env } from '../src/types.ts';
import { SealBroken, open, seal } from '../src/vault/seal.ts';

// One key for the whole file: seal.ts caches the derived KEK per isolate, which
// is the behaviour we want in production and which a second key would defeat.
const env = { JAR_KEY: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64') } as Env;

const UID_A = 'a'.repeat(32);
const UID_B = 'b'.repeat(32);
const KID = 1;
const jar = { jar: { ssid: 'secret-value', tdid: 'device' }, puuid: 'p', shard: 'na' };

test('a sealed session opens back to exactly what went in', async () => {
  assert.deepEqual(await open(env, UID_A, KID, await seal(env, UID_A, KID, jar)), jar);
});

test('the ciphertext does not contain the plaintext', async () => {
  const blob = await seal(env, UID_A, KID, jar);
  assert.ok(!blob.includes('secret-value'));
  assert.ok(!Buffer.from(blob, 'base64').toString('utf8').includes('secret-value'));
});

test('one flipped byte fails to open', async () => {
  const raw = Buffer.from(await seal(env, UID_A, KID, jar), 'base64');
  raw[raw.length - 1] ^= 1;
  await assert.rejects(() => open(env, UID_A, KID, raw.toString('base64')), SealBroken);
});

test('a flipped byte in the IV fails too', async () => {
  const raw = Buffer.from(await seal(env, UID_A, KID, jar), 'base64');
  raw[0] ^= 1;
  await assert.rejects(() => open(env, UID_A, KID, raw.toString('base64')), SealBroken);
});

// THE REASON THE AAD IS THERE. A row mix-up must fail closed rather than quietly
// hand one person another person's Riot session.
test("another user's uid cannot open this row", async () => {
  const blob = await seal(env, UID_A, KID, jar);
  await assert.rejects(() => open(env, UID_B, KID, blob), SealBroken);
});

test('a different key version cannot open this row', async () => {
  const blob = await seal(env, UID_A, KID, jar);
  await assert.rejects(() => open(env, UID_A, 2, blob), SealBroken);
});

test('the same plaintext seals differently every time', async () => {
  // Random IV per message. Equal blobs would leak that two users hold the same
  // session, and would eventually break GCM outright.
  const a = await seal(env, UID_A, KID, jar);
  const b = await seal(env, UID_A, KID, jar);
  assert.notEqual(a, b);
});

test('two users sealing identical data produce unrelated ciphertext', async () => {
  const a = await seal(env, UID_A, KID, jar);
  const b = await seal(env, UID_B, KID, jar);
  assert.notEqual(a, b);
});

test('garbage never throws something other than SealBroken', async () => {
  for (const bad of ['', 'not-base64!!', 'AAAA', Buffer.alloc(11).toString('base64')]) {
    await assert.rejects(() => open(env, UID_A, KID, bad), SealBroken);
  }
});

test('a realistic jar stays a sane size', async () => {
  // The measured pre-auth jar is 656 bytes; ssid pushes a full one to ~1.3 KB.
  // Nothing here is near a limit, but a surprise belongs in a test, not in prod.
  const big = { jar: Object.fromEntries([...Array(8)].map((_, i) => ['c' + i, 'x'.repeat(200)])) };
  const blob = await seal(env, UID_A, KID, big);
  assert.ok(blob.length < 4000, 'sealed blob was ' + blob.length + ' chars');
  assert.deepEqual(await open(env, UID_A, KID, blob), big);
});
