// The webhook verifier, against Svix's own published vector.
//
// This test exists because of a specific failure mode: a signature check that
// has only ever been observed returning false looks exactly like one that is
// broken. Deployed, every request to the hook came back 401 — correct, but
// equally what a verifier with the HMAC input in the wrong order would do.
// The vector below is the one Svix documents, so a pass here is the positive
// case that the live 401s cannot demonstrate.

import assert from 'node:assert/strict';
import { test } from 'vitest';
import { verify } from '../../src/alerts/svix.ts';

/** Svix's documented example. The signature is over
 *  `msg_id.timestamp.payload` with the bytes after `whsec_`. */
const VECTOR = {
  secret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
  id: 'msg_p5jXN8AQM9LWM0D4loKWxJek',
  stamp: '1614265330',
  body: '{"test": 2432232314}',
  sig: 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=',
};

/** Pinned to the vector's own moment, so the skew window is not the thing
 *  under test and the test does not rot. */
const NOW = Number(VECTOR.stamp) * 1000;

const ask = (over: Partial<Parameters<typeof verify>[0]> = {}) =>
  verify({
    secret: VECTOR.secret,
    id: VECTOR.id,
    stamp: VECTOR.stamp,
    sigs: VECTOR.sig,
    body: VECTOR.body,
    now: NOW,
    ...over,
  });

test('accepts the vector Svix publishes', async () => {
  assert.equal(await ask(), true);
});

test('accepts one good signature among several, as during a rotation', async () => {
  assert.equal(await ask({ sigs: 'v1,AAAA ' + VECTOR.sig }), true);
});

test('refuses a body that changed by one character', async () => {
  assert.equal(await ask({ body: '{"test": 2432232315}' }), false);
});

test('refuses a signature for a different message id', async () => {
  assert.equal(await ask({ id: 'msg_other' }), false);
});

test('refuses a different secret', async () => {
  assert.equal(await ask({ secret: 'whsec_' + btoa('not the one') }), false);
});

test('refuses a replay outside the five-minute window', async () => {
  assert.equal(await ask({ now: NOW + 6 * 60 * 1000 }), false);
  assert.equal(await ask({ now: NOW - 6 * 60 * 1000 }), false);
  // And accepts one inside it, so the window is a window and not a wall.
  assert.equal(await ask({ now: NOW + 4 * 60 * 1000 }), true);
});

test('refuses when anything is missing, including the secret', async () => {
  assert.equal(await ask({ secret: undefined }), false);
  assert.equal(await ask({ id: null }), false);
  assert.equal(await ask({ stamp: null }), false);
  assert.equal(await ask({ sigs: null }), false);
});

test('refuses a version it does not know', async () => {
  assert.equal(await ask({ sigs: VECTOR.sig.replace('v1,', 'v2,') }), false);
});

test('refuses a timestamp that is not a number', async () => {
  assert.equal(await ask({ stamp: 'soon' }), false);
});
