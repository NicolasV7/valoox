import assert from 'node:assert';
import { test } from 'vitest';
import type { Env } from '../../src/types.ts';
import { mintStop, readStop } from '../../src/vault/stop.ts';

// The one token this app puts in a URL. It is not a login — all it carries is
// permission to stop sending — but it is still a signature, and a signature
// nobody tested is a signature somebody forges.

const env = {
  JAR_KEY: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'),
} as Env;

const UID = 'a'.repeat(32);

test('a token names the row it was minted for', async () => {
  assert.equal(await readStop(env, await mintStop(env, UID)), UID);
});

test('a uid with no signature is nobody', async () => {
  assert.equal(await readStop(env, UID), null);
  assert.equal(await readStop(env, UID + '.'), null);
  assert.equal(await readStop(env, ''), null);
});

test('the signature cannot be lifted onto another uid', async () => {
  const token = await mintStop(env, UID);
  const sig = token.slice(token.lastIndexOf('.'));
  assert.equal(await readStop(env, 'b'.repeat(32) + sig), null);
});

test('one flipped character is enough to fail', async () => {
  const token = await mintStop(env, UID);
  // The FIRST character of the signature, not the last. Base64 spends six
  // bits per character and sixteen bytes is 128 of them, so the last
  // character carries two significant bits and six that decode to nothing —
  // flipping it leaves the bytes identical about three times in four, which
  // is how this test failed once and passed the next three runs.
  const cut = token.lastIndexOf('.') + 1;
  const head = token[cut] === 'A' ? 'B' : 'A';
  assert.equal(await readStop(env, token.slice(0, cut) + head + token.slice(cut + 1)), null);
});

test('a token from another key opens nothing', async () => {
  const other = {
    JAR_KEY: Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64'),
  } as Env;
  assert.equal(await readStop(env, await mintStop(other, UID)), null);
});

test('rotating the key voids every outstanding link at once', async () => {
  const token = await mintStop(env, UID);
  const rotated = { JAR_KEY: Buffer.from(new Uint8Array(32)).toString('base64') } as Env;
  assert.equal(await readStop(rotated, token), null);
  // ...and the same isolate goes back to answering for the old one, because
  // the derived key is cached on the secret itself and not on first use.
  assert.equal(await readStop(env, token), UID);
});

test('nothing that is not a string is a token', async () => {
  for (const junk of [null, undefined, 7, {}, ['a'], 'x'.repeat(300)]) {
    assert.equal(await readStop(env, junk), null, String(junk));
  }
});
