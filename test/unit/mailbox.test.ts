import assert from 'node:assert';
import { test } from 'vitest';
import { fold, sameMailbox } from '../../web/data/mailbox.ts';

// One screen decides whether to show a send button by asking whether the
// address in the field still reaches the row's inbox. These are the cases
// where the raw strings differ and the answer is yes.

const SAME = (a?: string, b?: string) => assert.equal(sameMailbox(a, b), true, a + ' vs ' + b);
const DIFF = (a?: string, b?: string) => assert.equal(sameMailbox(a, b), false, a + ' vs ' + b);

test('a half-typed tag has not changed the address yet', () => {
  SAME('first.last@example.com', 'first.last+@gmail.com');
  // ...and on a host with no opinion about + either
  SAME('someone@fastmail.com', 'someone+@fastmail.com');
});

test('case and surrounding space are not a different mailbox', () => {
  SAME('Ada@Gmail.com', '  ada@example.com ');
});

test("Google's own routing, on Google's own hosts", () => {
  SAME('first.last@example.com', 'first.last@example.com');
  SAME('first.last@example.com', 'first.last+valoox@gmail.com');
  SAME('first.last@example.com', 'first.last@googlemail.com');
  SAME('a.d.a+a@googlemail.com', 'ada+two@gmail.com');
});

test('and nowhere else, because elsewhere those characters are literal', () => {
  DIFF('ada.lovelace@example.org', 'adalovelace@example.org');
  DIFF('ada+valoox@example.org', 'ada@example.org');
  DIFF('ada@example.com', 'ada@example.com.co');
});

test('different people stay different people', () => {
  DIFF('ada@example.com', 'adanna@example.com');
  DIFF('ada@example.com', 'ada@example.net');
});

test('nothing is not the same as something', () => {
  DIFF('', 'ada@example.com');
  DIFF('ada@example.com', undefined);
  DIFF(undefined, undefined);
});

test('a string with no @ is compared as it stands rather than mangled', () => {
  assert.equal(fold('  NotAnAddress '), 'notanaddress');
  assert.equal(fold('@gmail.com'), '@gmail.com');
});
