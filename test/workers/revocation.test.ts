import { beforeEach, expect, test } from 'vitest';
import { route } from '../../src/router.ts';
import * as scans from '../../src/storage/scans.ts';
import type { Env } from '../../src/types.ts';
import { browserId } from '../../src/vault/keys.ts';
import { CURRENT_KID, seal } from '../../src/vault/seal.ts';
import { readSession } from '../../src/vault/session.ts';
import { session } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
const oldSecret = 'c'.repeat(64);
const newSecret = 'd'.repeat(64);
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});
async function approve() {
  const uid = await browserId(env, oldSecret);
  const next = await browserId(env, newSecret);
  await scans.begin(
    env,
    uid,
    crypto.randomUUID(),
    CURRENT_KID,
    await seal(env, uid, CURRENT_KID, { jar: {}, phase: 'identify' }, 'scan:2'),
  );
  const held = await scans.claim(env, uid);
  if (!held || held === 'busy') throw new Error('fixture');
  expect(
    await scans.finish(env, held, {
      uid: next,
      kid: CURRENT_KID,
      blob: await seal(env, next, CURRENT_KID, session()),
      acct: null,
      alerts: false,
    }),
  ).toBe(true);
  return next;
}
test('logout with the cookie sent before QR completion also deletes the successor', async () => {
  const next = await approve();
  expect(await readSession(env, next)).not.toBeNull();
  const res = await route(
    new Request('https://drop.valoox.store/api/logout', {
      method: 'POST',
      headers: { cookie: '__Host-val=' + oldSecret, 'sec-fetch-site': 'same-origin' },
    }),
    env,
  );
  expect(await res.json()).toEqual({ ok: true });
  expect(await readSession(env, next)).toBeNull();
});
test('revocation aliases never authorize API reads with the preceding cookie', async () => {
  await approve();
  const res = await route(
    new Request('https://drop.valoox.store/api/prefs', {
      headers: { cookie: '__Host-val=' + oldSecret },
    }),
    env,
  );
  expect(await res.json()).toEqual({ needsReseed: true });
});
