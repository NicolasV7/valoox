import assert from 'node:assert';
import { test } from 'vitest';
import type { Env } from '../../src/types.ts';
import { mintStop, readStop } from '../../src/vault/stop.ts';

// The one token this app puts in a URL. It is not a login — all it carries is
// permission to stop sending — but it travels in a mailbox, so two different
// things have to hold: nobody can forge one, and nobody who reads one learns
// anything. The second had no test and that is exactly what went wrong: the
// token used to be `<uid>.<nonce>.<hmac>` with the uid in the clear, and the
// uid is the session cookie, so every message handed out a working credential
// to whoever touched it.

const key = () => Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
const env = { JAR_KEY: key() } as Env;

const UID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

test('a token names the row it was minted for', async () => {
  assert.equal((await readStop(env, await mintStop(env, UID)))?.uid, UID);
});

// --- what it must not give away ---------------------------------------------

test('the uid is nowhere in the token', async () => {
  const token = await mintStop(env, UID);
  assert.ok(!token.includes(UID), 'the session cookie is readable in the link: ' + token);
  // Nor any run of it long enough to be worth trying. Eight hex characters is
  // the shortest prefix that would tell an attacker they had the right row.
  for (let i = 0; i + 8 <= UID.length; i++) {
    assert.ok(!token.includes(UID.slice(i, i + 8)), 'a slice of the uid survives at ' + i);
  }
});

test('two links for one row look unrelated', async () => {
  const a = await mintStop(env, UID);
  const b = await mintStop(env, UID);
  // A shared prefix would say "same account" to anyone holding two messages.
  assert.notEqual(a.slice(0, 16), b.slice(0, 16));
});

test('every link is its own link, so spending one leaves the rest alone', async () => {
  const a = await readStop(env, await mintStop(env, UID));
  const b = await readStop(env, await mintStop(env, UID));
  assert.equal(a?.uid, b?.uid);
  assert.notEqual(a?.id, b?.id);
});

// --- what it must not accept ------------------------------------------------

test('a uid on its own is nobody', async () => {
  assert.equal(await readStop(env, UID), null);
  assert.equal(await readStop(env, UID + '.'), null);
  assert.equal(await readStop(env, ''), null);
});

test('one flipped bit is enough to fail, anywhere in the token', async () => {
  const token = await mintStop(env, UID);
  const raw = Buffer.from(token, 'base64url');
  // Bytes, not characters. Base64 spends six bits per character and the last
  // one carries fewer than six significant bits, so flipping a character can
  // decode to the same bytes — which is how the version of this test before
  // it passed three runs in four. One byte each from the iv, the ciphertext
  // and the tag.
  for (const at of [0, 20, raw.length - 1]) {
    const bent = Buffer.from(raw);
    bent[at] = (bent[at] as number) ^ 0x40;
    assert.equal(
      await readStop(env, bent.toString('base64url')),
      null,
      'survived a flipped byte at ' + at + ' of ' + raw.length,
    );
  }
});

test('nothing can be moved from one token to another', async () => {
  const a = await mintStop(env, UID);
  const b = await mintStop(env, 'b'.repeat(32));
  const half = Math.floor(a.length / 2);
  assert.equal(await readStop(env, a.slice(0, half) + b.slice(half)), null);
  assert.equal(await readStop(env, b.slice(0, half) + a.slice(half)), null);
});

test('a token from another key opens nothing', async () => {
  assert.equal(await readStop(env, await mintStop({ JAR_KEY: key() } as Env, UID)), null);
});

test('rotating the key voids every outstanding link at once', async () => {
  const token = await mintStop(env, UID);
  const rotated = { JAR_KEY: Buffer.from(new Uint8Array(32)).toString('base64') } as Env;
  assert.equal(await readStop(rotated, token), null);
  // ...and the same isolate goes back to answering for the old one, because
  // the derived key is cached on the secret itself and not on first use.
  assert.equal((await readStop(env, token))?.uid, UID);
});

test('a sealed session is not a token', async () => {
  // Different `info` on the same JAR_KEY, so the two keys are unrelated and a
  // blob lifted out of D1 cannot be pasted into a link.
  const { seal } = await import('../../src/vault/seal.ts');
  const blob = await seal(env, UID, 1, { hello: 'there' });
  assert.equal(await readStop(env, blob.replace(/\+/g, '-').replace(/\//g, '_')), null);
});

test('nothing that is not a string is a token', async () => {
  for (const junk of [null, undefined, 7, {}, ['a'], 'x'.repeat(300)]) {
    assert.equal(await readStop(env, junk), null, String(junk));
  }
});
