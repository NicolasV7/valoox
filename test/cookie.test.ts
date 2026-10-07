import { test } from 'node:test';
import assert from 'node:assert';
import { clear, mint, read, sameOrigin, set } from '../src/app/cookie.ts';

const req = (h: Record<string, string> = {}) => new Request('https://x/api/store', { headers: h });

test('mint produces 32 hex characters, and not the same one twice', () => {
  const a = mint();
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.notEqual(a, mint());
});

test('read finds the uid among other cookies', () => {
  const uid = mint();
  assert.equal(read(req({ cookie: 'other=1; uid=' + uid + '; more=2' })), uid);
  assert.equal(read(req({ cookie: ' uid=' + uid })), uid);
});

test('read rejects anything that did not come from mint', () => {
  // The uid goes straight into a SQL bind and a KV key. Validate its shape here,
  // at the edge, rather than trusting every call site downstream.
  assert.equal(read(req({ cookie: 'uid=' })), null);
  assert.equal(read(req({ cookie: 'uid=short' })), null);
  assert.equal(read(req({ cookie: 'uid=' + 'A'.repeat(32) })), null, 'uppercase is not hex here');
  assert.equal(read(req({ cookie: 'uid=' + 'a'.repeat(33) })), null);
  assert.equal(read(req({ cookie: "uid=' OR 1=1--" })), null);
  assert.equal(read(req()), null);
});

test('the cookie is httpOnly, Secure, Strict and scoped to /api', () => {
  const h = new Headers();
  set(h, mint());
  const v = h.get('set-cookie') as string;
  assert.match(v, /HttpOnly/);
  assert.match(v, /Secure/);
  assert.match(v, /SameSite=Strict/);
  assert.match(v, /Path=\/api/, 'keeps it off every static asset request');
});

test('clear expires the cookie rather than leaving it', () => {
  const h = new Headers();
  clear(h);
  assert.match(h.get('set-cookie') as string, /uid=; Max-Age=0/);
});

test('cross-site writes are refused without needing a CSRF token', () => {
  assert.equal(sameOrigin(req({ 'sec-fetch-site': 'cross-site' })), false);
  assert.equal(sameOrigin(req({ 'sec-fetch-site': 'same-site' })), false);
  assert.equal(sameOrigin(req({ 'sec-fetch-site': 'same-origin' })), true);
  assert.equal(sameOrigin(req({ 'sec-fetch-site': 'none' })), true, 'typed into the address bar');
  assert.equal(sameOrigin(req()), true, 'header absent on very old browsers');
});
