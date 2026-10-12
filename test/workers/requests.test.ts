import { beforeEach, expect, test } from 'vitest';
import { route } from '../../src/router.ts';
import type { Env } from '../../src/types.ts';
import { browserId } from '../../src/vault/keys.ts';
import { createSession } from '../../src/vault/session.ts';
import { session } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
const secret = 'c'.repeat(64);
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});
const request = (
  path: string,
  method = 'GET',
  headers: Record<string, string> = {},
  body?: string,
) =>
  route(
    new Request('https://drop.valoox.store' + path, {
      method,
      headers: { cookie: '__Host-val=' + secret, ...headers },
      body,
    }),
    env,
  );
test('unsupported verbs never execute a GET handler', async () => {
  for (const method of ['DELETE', 'PUT', 'PATCH', 'OPTIONS', 'HEAD']) {
    const res = await request('/api/prefs', method);
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, POST');
  }
});
test('mutations reject absent metadata, sibling origins and conflicting Origin', async () => {
  for (const headers of [
    {},
    { origin: 'https://evil.valoox.store' },
    { origin: 'https://evil.invalid', 'sec-fetch-site': 'same-origin' },
  ] as Record<string, string>[]) {
    expect((await request('/api/logout', 'POST', headers)).status).toBe(403);
  }
  expect(
    (await request('/api/logout', 'POST', { origin: 'https://drop.valoox.store' })).status,
  ).toBe(200);
});
test('anonymous preference writes authenticate before reading a large body', async () => {
  const res = await request(
    '/api/prefs',
    'POST',
    {
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json',
    },
    'x'.repeat(1024 * 1024),
  );
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ needsReseed: true });
});
test('authenticated bodies are bounded, including chunked requests', async () => {
  await createSession(env, await browserId(env, secret), session());
  const headers = { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' };
  expect((await request('/api/prefs', 'POST', headers, 'x'.repeat(65537))).status).toBe(413);
  expect((await request('/api/prefs', 'POST', headers, '{}')).status).toBe(200);
  expect(
    (await request('/api/prefs', 'POST', { ...headers, 'content-type': 'text/plain' }, '{}'))
      .status,
  ).toBe(415);
  expect((await request('/api/prefs', 'POST', headers, '[')).status).toBe(400);
});
test('the edge limit runs before any expensive QR operation', async () => {
  env = { ...env, EDGE: { limit: async () => ({ success: false }) } };
  expect((await request('/api/qr', 'POST', { 'sec-fetch-site': 'same-origin' })).status).toBe(429);
  expect(await env.DB.prepare('SELECT * FROM scans').first()).toBeNull();
});
test('webhooks have independent signatures and bounded bodies', async () => {
  expect((await request('/api/hook/resend', 'GET')).status).toBe(405);
  expect((await request('/api/hook/resend', 'POST', {}, '{}')).status).toBe(401);
  expect((await request('/api/hook/resend', 'POST', {}, 'x'.repeat(65537))).status).toBe(413);
});
