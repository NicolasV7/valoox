import { beforeEach, expect, test } from 'vitest';
import type { Env } from '../../src/types.ts';
import { adopt } from '../../src/vault/adopt.ts';
import { b64, bytes, enc } from '../../src/vault/keys.ts';
import * as repo from '../../src/vault/repo.ts';
import { session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

let env: Env;
const OLD = 'd'.repeat(32);
beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
  const key = await crypto.subtle.importKey('raw', bytes(KEY), 'HKDF', false, ['deriveKey']);
  const user = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: enc.encode('kid:1'),
      info: enc.encode('jar:' + OLD),
    },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode('1|' + OLD) },
    user,
    enc.encode(
      JSON.stringify({
        ...session(),
        wishlist: [{ id: 'wanted', name: 'Wanted' }],
        mail: { to: 'person@example.invalid', ok: true },
      }),
    ),
  );
  const raw = new Uint8Array(12 + ct.byteLength);
  raw.set(iv);
  raw.set(new Uint8Array(ct), 12);
  await repo.upsert(env, OLD, 1, b64(raw), null);
});
test('fresh Riot confirmation may adopt legacy preferences without adopting its credential', async () => {
  const old = await adopt(env, UID, session().puuid as string, OLD);
  expect(old.legacy).toBe(OLD);
  expect(old.preferences.wishlist).toEqual([{ id: 'wanted', name: 'Wanted' }]);
  expect(old.preferences.mail?.gen).toBeDefined();
  expect(old.preferences).not.toHaveProperty('jar');
});
test('knowing a legacy row id cannot transfer preferences to a different Riot account', async () => {
  expect(await adopt(env, UID, 'another-account', OLD)).toEqual({
    preferences: {},
    legacy: undefined,
  });
  expect(await repo.get(env, OLD)).not.toBeNull();
});
