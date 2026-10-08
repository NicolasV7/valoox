import assert from 'node:assert';
import { test } from 'vitest';
import { gotThere, outranks, refused } from '../../src/vault/mail.ts';

// The provider's last word about a message is the only thing that decides
// whether "send it again" is offered. Two reasons to withhold it, and they are
// different: a bounce means the address cannot receive at all, an open means
// the code is already sitting in a mailbox. One is permanent until the address
// changes, the other lifts when the code expires.

test('a bounce, a complaint and a 4xx all mean the address cannot receive', () => {
  for (const said of ['email.bounced', 'email.complained', 'resend 422']) {
    assert.equal(refused(said), true, said);
  }
});

test('nothing else counts as a refusal, least of all silence', () => {
  for (const said of ['email.sent', 'email.delivered', 'email.opened', 'resend 200', undefined]) {
    assert.equal(refused(said), false, String(said));
  }
});

test('only an open says the message reached a mailbox', () => {
  assert.equal(gotThere('email.opened'), true);
  // delivered is the receiving server, which a spam folder also is
  assert.equal(gotThere('email.delivered'), false);
  assert.equal(gotThere(undefined), false);
});

test('a slower event cannot walk the state backwards', () => {
  assert.equal(outranks('email.delivered', 'email.opened'), false);
  assert.equal(outranks('email.sent', 'email.delivered'), false);
  assert.equal(outranks('email.opened', 'email.delivered'), true);
});

test('a bounce outranks everything, because it is the one that changes the app', () => {
  for (const was of ['email.sent', 'email.delivered', 'email.opened', 'email.clicked']) {
    assert.equal(outranks('email.bounced', was), true, was);
  }
});

test('the same event twice is still allowed through, so a retry is harmless', () => {
  assert.equal(outranks('email.delivered', 'email.delivered'), true);
});

test('the status written at send time loses to any real event', () => {
  assert.equal(outranks('email.sent', 'resend 200'), true);
});

test('an event nobody has weighed is dropped rather than guessed at', () => {
  assert.equal(outranks('email.scheduled', 'email.delivered'), false);
});
