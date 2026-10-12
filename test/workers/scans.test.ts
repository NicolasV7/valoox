import { beforeEach, expect, test, vi } from 'vitest';
import { route } from '../../src/router.ts';
import * as scans from '../../src/storage/scans.ts';
import type { Env } from '../../src/types.ts';
import { browserId } from '../../src/vault/keys.ts';
import { CURRENT_KID, open, seal } from '../../src/vault/seal.ts';
import { createSession, forget, readSession } from '../../src/vault/session.ts';
import { OTHER, session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

vi.mock('../../src/vault/auth.ts', () => ({
  reauth: async () => ({ access: 'fixture', id: 'fixture' }),
  identify: async () => ({
    puuid: '1aefc04b-4455-8b2f-6332-79b4260aaffe',
    shard: 'na',
    name: 'Fresh#TAG',
  }),
}));
let env: Env;
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});
async function begin(uid = UID) {
  const blob = await seal(
    env,
    uid,
    CURRENT_KID,
    { jar: { ssid: 'test-credential' }, phase: 'identify' },
    'scan:2',
  );
  await scans.begin(env, uid, crypto.randomUUID(), CURRENT_KID, blob);
  return blob;
}
async function held() {
  const row = await scans.claim(env, UID);
  if (!row || row === 'busy') throw new Error('fixture');
  return row;
}
const next = () => ({
  uid: OTHER,
  kid: CURRENT_KID,
  blob: 'sealed-next',
  acct: null,
  alerts: false,
});
test('pending QR cookies are encrypted and cannot be read as a session', async () => {
  const blob = await begin();
  expect(blob).not.toContain('test-credential');
  expect((await env.VAL.list({ prefix: 'scan:' })).keys).toHaveLength(0);
  await expect(open(env, UID, CURRENT_KID, blob)).rejects.toThrow();
});
test('only one poll owns the scan and saving never extends its expiration', async () => {
  await begin();
  const claims = await Promise.all(Array.from({ length: 12 }, () => scans.claim(env, UID)));
  expect(claims.filter((v) => v && v !== 'busy')).toHaveLength(1);
  const row = claims.find((v) => v && v !== 'busy');
  if (!row || row === 'busy') throw new Error('fixture');
  const expiry = row.expires;
  expect(await scans.save(env, row, row.blob)).toBe(true);
  expect((await env.DB.prepare('SELECT expires FROM scans').first())?.expires).toBe(expiry);
});
test('logout cancels a QR even when a poll already holds its jar', async () => {
  await begin();
  const row = await held();
  await forget(env, UID);
  expect(await scans.save(env, row, row.blob)).toBe(false);
  expect(await scans.finish(env, row, next())).toBe(false);
  expect(await readSession(env, OTHER)).toBeNull();
});
test('a replacement or expired scan cannot finish an older approval', async () => {
  await begin();
  const row = await held();
  await begin();
  expect(await scans.finish(env, row, next())).toBe(false);
  const fresh = await held();
  await env.DB.prepare('UPDATE scans SET expires=0').run();
  expect(await scans.save(env, fresh, fresh.blob)).toBe(false);
  expect(await scans.finish(env, fresh, next())).toBe(false);
});
test('a poll whose lease was replaced cannot write or commit', async () => {
  await begin();
  const row = await held();
  await env.DB.prepare('UPDATE scans SET lease=lease+1').run();
  expect(await scans.save(env, row, row.blob)).toBe(false);
  expect(await scans.finish(env, row, next())).toBe(false);
});
test('QR approval rotates the browser secret and preserves confirmed account preferences', async () => {
  const secret = 'd'.repeat(64);
  const uid = await browserId(env, secret);
  await createSession(env, uid, { ...session(), wishlist: [{ id: 'wanted', name: 'Wanted' }] });
  await begin(uid);
  const res = await route(
    new Request('https://drop.valoox.store/api/qr', {
      headers: { cookie: '__Host-val=' + secret, 'sec-fetch-site': 'same-origin' },
    }),
    env,
  );
  expect(await res.json()).toEqual({ status: 'ok', shard: 'na' });
  const fresh = /__Host-val=([0-9a-f]{64})/.exec(res.headers.get('set-cookie') ?? '')?.[1];
  expect(fresh).toBeDefined();
  expect(fresh).not.toBe(secret);
  const current = await readSession(env, await browserId(env, fresh as string));
  expect(current?.session.name).toBe('Fresh#TAG');
  expect(current?.session.wishlist).toEqual([{ id: 'wanted', name: 'Wanted' }]);
  expect(await readSession(env, uid)).toBeNull();
});
