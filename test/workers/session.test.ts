import { beforeEach, expect, test } from 'vitest';
import type { Env, Session } from '../../src/types.ts';
import * as repo from '../../src/vault/repo.ts';
import { createSession, forget, readSession, saveSession } from '../../src/vault/session.ts';
import { freshDb, KEY } from './setup.ts';

// The seal and the store, together. The unit tests prove the crypto in isolation;
// these prove that what goes into D1 comes back out as the same session and that
// one browser cannot read another's row.

let env: Env;
const UID = 'c'.repeat(32);
const OTHER = 'd'.repeat(32);

const session = (): Session => ({
  jar: { ssid: 'a-2fa-bypassing-credential', tdid: 'device' },
  puuid: '1aefc04b-4455-8b2f-6332-79b4260aaffe',
  shard: 'na',
});

beforeEach(async () => {
  env = { ...(await freshDb()), JAR_KEY: KEY };
});

test('a session survives the round trip through D1 unchanged', async () => {
  await createSession(env, UID, session());
  const held = await readSession(env, UID);
  expect(held?.session).toEqual(session());
  expect(held?.ver).toBe(0);
});

test('what lands in the column is ciphertext, not the session', async () => {
  await createSession(env, UID, session());
  const row = await repo.get(env, UID);
  expect(row?.blob).not.toContain('a-2fa-bypassing-credential');
  // The puuid is a stable Riot identifier and must never be a column: a raw table
  // dump has to reveal no Riot identity at all.
  expect(row?.blob).not.toContain('1aefc04b');
  expect(JSON.stringify(row)).not.toContain('1aefc04b');
});

test('another browser cannot open this row', async () => {
  // Each row is sealed with a key derived for its own uid, and uid is bound as
  // AES-GCM additionalData — so a row mix-up fails closed instead of quietly
  // handing one person another person's Riot session.
  await createSession(env, UID, session());
  const row = await repo.get(env, UID);
  await env.DB.prepare(
    'INSERT INTO s (uid, kid, blob, ver, created_at, last_used) VALUES (?, ?, ?, 0, 0, 0)',
  )
    .bind(OTHER, row?.kid ?? 1, row?.blob ?? '')
    .run();

  await expect(readSession(env, OTHER)).rejects.toThrow();
});

test('saving a rolled-forward jar bumps the version', async () => {
  await createSession(env, UID, session());
  const s = session();
  s.jar.ssid = 'rotated-by-riot';

  expect(await saveSession(env, UID, s, 0)).toBe(true);
  const held = await readSession(env, UID);
  expect(held?.session.jar.ssid).toBe('rotated-by-riot');
  expect(held?.ver).toBe(1);

  // A stale writer must be told it lost rather than overwrite the live jar.
  expect(await saveSession(env, UID, session(), 0)).toBe(false);
  expect((await readSession(env, UID))?.session.jar.ssid).toBe('rotated-by-riot');
});

test('a missing session reads as null, not as an error', async () => {
  expect(await readSession(env, UID)).toBeNull();
});

test('forget removes the row and leaves other browsers signed in', async () => {
  await createSession(env, UID, session());
  await createSession(env, OTHER, session());

  await forget(env, UID);
  expect(await readSession(env, UID)).toBeNull();
  expect(await readSession(env, OTHER)).not.toBeNull();
});

test('rotating the key orphans every stored session', async () => {
  // This is the kill switch: one `wrangler secret put` makes every ciphertext
  // that exists undecryptable, including D1 Time Travel snapshots.
  await createSession(env, UID, session());
  const rotated = {
    ...env,
    JAR_KEY: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))),
  };
  await expect(readSession(rotated, UID)).rejects.toThrow();
});
