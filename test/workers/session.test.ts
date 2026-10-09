import { beforeEach, expect, test } from 'vitest';
import type { Env, Session } from '../../src/types.ts';
import * as repo from '../../src/vault/repo.ts';
import {
  createSession,
  forget,
  readCache,
  readSession,
  saveSession,
  writeCache,
} from '../../src/vault/session.ts';
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

test('another browser cannot open this row, and the row does not survive', async () => {
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

  // Null, not a throw. Every caller already turns null into "scan again"; a
  // throw reached the router as a 502 and the page blamed Riot for it.
  expect(await readSession(env, OTHER)).toBeNull();
  expect(await repo.get(env, OTHER)).toBeNull();
  // And the row it was copied from is untouched.
  expect((await readSession(env, UID))?.session).toEqual(session());
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

test('rotating the key signs everybody out rather than bricking them', async () => {
  // This is the kill switch: one `wrangler secret put` makes every ciphertext
  // that exists undecryptable, including D1 Time Travel snapshots.
  //
  // Undecryptable was never the hard part. What this pins is the second half —
  // that the browser is then told to scan again. It used to throw, nothing
  // caught it, the router answered 502, and the page rendered "Riot did not
  // answer" with a Retry that could never work, on a screen with no way to
  // reach the one call that would have cleared the row.
  await createSession(env, UID, session());
  const rotated = { ...env, JAR_KEY: another() };

  expect(await readSession(rotated, UID)).toBeNull();
  expect(await repo.get(env, UID)).toBeNull();
});

test('a rotation also orphans what the cache is already holding', async () => {
  // readCache answers before D1 is touched, so a rotation that only killed the
  // row left every browser still holding its uid cookie receiving that
  // account's store view and Riot name for the rest of the rotation window.
  // The cache key carries the key's own fingerprint, so changing the key makes
  // every entry unreachable in the same request.
  await writeCache(env, 'store', UID, { name: 'Player#TAG' }, 3600);
  expect(await readCache(env, 'store', UID)).toEqual({ name: 'Player#TAG' });
  // And what KV actually holds is ciphertext. The store view carries the Riot
  // game name, the tag, the rank and the shard, and KV has no per-row
  // encryption boundary — so a dump of it used to be a list of who uses this.
  const keys = await env.VAL.list({ prefix: 'store' });
  const stored = await env.VAL.get((keys.keys[0] as { name: string }).name);
  expect(stored).not.toContain('Player#TAG');

  const rotated = { ...env, JAR_KEY: another() };
  expect(await readCache(rotated, 'store', UID)).toBeNull();
  // ...and the old key still reaches its own, so this is a key boundary and
  // not a cache that quietly stopped working.
  expect(await readCache(env, 'store', UID)).toEqual({ name: 'Player#TAG' });
});

const another = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
