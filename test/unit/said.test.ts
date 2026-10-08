import assert from 'node:assert';
import { test } from 'vitest';
import { gotThere, outranks, refused } from '../../src/vault/mail.ts';

// The provider's last word about a message is the only thing that decides
// whether "send it again" is offered. Two reasons to withhold it, and they are
// different: a dead address cannot receive at all, an open means the code is
// already sitting in a mailbox. One is permanent until the address changes,
// the other lifts when the code expires.

test('four ways to say the address cannot receive', () => {
  for (const said of [
    'email.bounced',
    'email.complained',
    // Not sent at all: the channel already had this address on its block
    // list, from an earlier bounce or complaint. Nothing we do changes that,
    // so it shuts the same door a bounce does.
    'email.suppressed',
    'resend 422',
  ]) {
    assert.equal(refused(said), true, said);
  }
});

test('nothing else counts as a refusal, least of all silence', () => {
  for (const said of ['email.sent', 'email.delivered', 'email.opened', 'resend 200', undefined]) {
    assert.equal(refused(said), false, String(said));
  }
});

test('two events say the message got where it was going', () => {
  // opened needs tracking switched on at the provider and in practice never
  // arrives; delivered needs nothing and is what actually does the work.
  assert.equal(gotThere('email.opened'), true);
  assert.equal(gotThere('email.delivered'), true);
  // Everything before and beside those is still in flight.
  assert.equal(gotThere('email.sent'), false);
  assert.equal(gotThere('email.delivery_delayed'), false);
  assert.equal(gotThere(undefined), false);
});

test('a slower event cannot walk the state backwards', () => {
  assert.equal(outranks('email.delivered', 'email.opened'), false);
  assert.equal(outranks('email.sent', 'email.delivered'), false);
  assert.equal(outranks('email.opened', 'email.delivered'), true);
});

test('a dead address outranks everything, being what changes what the app allows', () => {
  for (const dead of ['email.bounced', 'email.complained', 'email.suppressed']) {
    for (const was of ['email.sent', 'email.delivered', 'email.opened', 'email.clicked']) {
      assert.equal(outranks(dead, was), true, dead + ' over ' + was);
    }
  }
});

test('a suppression is not an open: nothing reached a mailbox', () => {
  assert.equal(gotThere('email.suppressed'), false);
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
