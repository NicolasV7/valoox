import assert from 'node:assert';
import { test } from 'vitest';
import { fold, sameMailbox } from '../../web/data/mailbox.ts';

// One screen decides whether to show a send button by asking whether the
// address in the field still reaches the row's inbox. These are the cases
// where the raw strings differ and the answer is yes.
//
// The people are invented. A fixture is a string in a public repository's
// history forever, and a real address in one is a real address in one.

const SAME = (a?: string, b?: string) => assert.equal(sameMailbox(a, b), true, a + ' vs ' + b);
const DIFF = (a?: string, b?: string) => assert.equal(sameMailbox(a, b), false, a + ' vs ' + b);

test('a half-typed tag has not changed the address yet', () => {
  SAME('ada1815lovelace@gmail.com', 'ada1815lovelace+@gmail.com');
  // ...and on a host with no opinion about + either
  SAME('someone@fastmail.com', 'someone+@fastmail.com');
});

test('case and surrounding space are not a different mailbox', () => {
  SAME('Ada@Gmail.com', '  ada@gmail.com ');
});

test("Google's own routing, on Google's own hosts", () => {
  SAME('ada1815lovelace@gmail.com', 'ada.1815.lovelace@gmail.com');
  SAME('ada1815lovelace@gmail.com', 'ada1815lovelace+valoox@gmail.com');
  SAME('ada1815lovelace@gmail.com', 'ada1815lovelace@googlemail.com');
  SAME('a.d.a+one@googlemail.com', 'ada+two@gmail.com');
});

test('and nowhere else, because elsewhere those characters are literal', () => {
  DIFF('ada.lovelace@fastmail.com', 'adalovelace@fastmail.com');
  DIFF('ada+valoox@fastmail.com', 'ada@fastmail.com');
  DIFF('ada@gmail.com', 'ada@gmail.com.co');
});

test('different people stay different people', () => {
  DIFF('ada@gmail.com', 'adanna@gmail.com');
  DIFF('ada@gmail.com', 'ada@hotmail.com');
});

test('nothing is not the same as something', () => {
  DIFF('', 'ada@gmail.com');
  DIFF('ada@gmail.com', undefined);
  DIFF(undefined, undefined);
});

test('a string with no @ is compared as it stands rather than mangled', () => {
  assert.equal(fold('  NotAnAddress '), 'notanaddress');
  assert.equal(fold('@gmail.com'), '@gmail.com');
});
