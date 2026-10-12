import { expect, test } from 'vitest';
import { clear, legacy, mint, read, sameOrigin, set } from '../../src/app/cookie.ts';
import type { Env } from '../../src/types.ts';
import { browserId } from '../../src/vault/keys.ts';

const req = (headers: Record<string, string> = {}) =>
  new Request('https://x/api/store', { headers });
test('browser secrets have 256 random bits and are never storage ids', async () => {
  const a = mint();
  expect(a).toMatch(/^[0-9a-f]{64}$/);
  expect(a).not.toBe(mint());
  const env = { JAR_KEY: Buffer.alloc(32, 7).toString('base64') } as Env;
  const uid = await browserId(env, a);
  expect(uid).not.toBe(a);
  expect(await browserId(env, uid)).not.toBe(uid);
});
test('only one valid host cookie authenticates', () => {
  const secret = mint();
  expect(read(req({ cookie: 'other=1; __Host-val=' + secret }))).toBe(secret);
  for (const cookie of [
    'uid=' + 'a'.repeat(32),
    '__Host-val=short',
    '__Host-val=' + secret + '; __Host-val=' + secret,
    '__Host-val=' + 'A'.repeat(64),
  ]) {
    expect(read(req({ cookie }))).toBeNull();
  }
  expect(legacy(req({ cookie: 'uid=' + 'a'.repeat(32) }))).toBe('a'.repeat(32));
});
test('the browser enforces host-only cookie placement', () => {
  const h = new Headers();
  set(h, mint());
  expect(h.get('set-cookie')).toMatch(
    /^__Host-val=.+; Path=\/; Secure; HttpOnly; SameSite=Strict$/,
  );
  expect(h.get('set-cookie')).not.toContain('Domain=');
  clear(h);
  expect(h.get('set-cookie')).toContain('__Host-val=; Max-Age=0');
});
test('mutations need same-origin browser metadata or an exact Origin', () => {
  for (const site of ['cross-site', 'same-site', 'none']) {
    expect(sameOrigin(req({ 'sec-fetch-site': site }))).toBe(false);
  }
  expect(sameOrigin(req())).toBe(false);
  expect(sameOrigin(req({ origin: 'https://x' }))).toBe(true);
  expect(sameOrigin(req({ origin: 'https://evil.x' }))).toBe(false);
  expect(sameOrigin(req({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
  expect(sameOrigin(req({ 'sec-fetch-site': 'same-origin', origin: 'https://evil.x' }))).toBe(
    false,
  );
});
