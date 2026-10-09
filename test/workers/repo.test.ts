import { beforeEach, expect, test } from 'vitest';
import type { Env } from '../../src/types.ts';
import * as repo from '../../src/vault/repo.ts';
import { freshDb } from './setup.ts';

// The storage layer against real local D1 — the whole reason this project runs a
// second test runtime. Every bug below was found by hand against production
// before it had a test; now it cannot come back.

let env: Env;
const UID = 'a'.repeat(32);
const OTHER = 'b'.repeat(32);

beforeEach(async () => {
  env = await freshDb();
});

test('a second sign-in from the same browser overwrites instead of failing', async () => {
  // A browser whose session expired still holds its uid cookie AND its dead row.
  // With a plain INSERT this throws `UNIQUE constraint failed: s.uid`, breaking
  // re-entry at exactly the moment the user has no working session to fall back
  // on. That shipped once, and only live probing caught it.
  await repo.upsert(env, UID, 1, 'first', null);
  await repo.upsert(env, UID, 1, 'second', null);

  const row = await repo.get(env, UID);
  expect(row?.blob).toBe('second');
  expect(row?.ver).toBe(0); // reset, because the caller's follow-up save pins ver 0
});

test('compare-and-swap lets the first writer win and tells the second it lost', async () => {
  await repo.upsert(env, UID, 1, 'v0', null);

  expect(await repo.update(env, UID, 1, 'from tab A', 0)).toBe(true);
  // Tab B still holds ver 0 and must not clobber a jar Riot has already rotated.
  expect(await repo.update(env, UID, 1, 'from tab B', 0)).toBe(false);

  const row = await repo.get(env, UID);
  expect(row?.blob).toBe('from tab A');
  expect(row?.ver).toBe(1);
});

test('an update moves the kid with the blob it describes', async () => {
  await repo.upsert(env, UID, 1, 'sealed under one', null);
  // What a CURRENT_KID bump does: the save re-seals under the new key, and the
  // row has to say so or every later read derives the old subkey and fails
  // closed. The column was simply not in the UPDATE.
  expect(await repo.update(env, UID, 2, 'sealed under two', 0)).toBe(true);

  const row = await repo.get(env, UID);
  expect(row?.kid).toBe(2);
  expect(row?.blob).toBe('sealed under two');
});

test('an update to a row that does not exist reports failure, not success', async () => {
  expect(await repo.update(env, UID, 1, 'ghost', 0)).toBe(false);
  expect(await repo.get(env, UID)).toBeNull();
});

test('only rows that asked for alerts are listed', async () => {
  await repo.upsert(env, UID, 1, 'wants', null);
  await repo.upsert(env, OTHER, 1, 'does not', null);
  await repo.setAlerts(env, UID, true);

  const rows = await repo.listAlerting(env);
  expect(rows.map((r) => r.uid)).toEqual([UID]);

  await repo.setAlerts(env, UID, false);
  expect(await repo.listAlerting(env)).toEqual([]);
});

test('prune deletes what was abandoned and keeps what is in use', async () => {
  await repo.upsert(env, UID, 1, 'active', null);
  await repo.upsert(env, OTHER, 1, 'abandoned', null);
  const old = Math.floor(Date.now() / 1000) - 20 * 86400;
  await env.DB.prepare('UPDATE s SET last_used = ? WHERE uid = ?').bind(old, OTHER).run();

  expect(await repo.prune(env, 10)).toBe(1);
  expect(await repo.get(env, UID)).not.toBeNull();
  expect(await repo.get(env, OTHER)).toBeNull();
});

test('prune keeps a row that is exactly at the boundary', async () => {
  await repo.upsert(env, UID, 1, 'borderline', null);
  const justInside = Math.floor(Date.now() / 1000) - 10 * 86400 + 60;
  await env.DB.prepare('UPDATE s SET last_used = ? WHERE uid = ?').bind(justInside, UID).run();

  expect(await repo.prune(env, 10)).toBe(0);
  expect(await repo.get(env, UID)).not.toBeNull();
});

test('remove deletes one row and leaves the rest alone', async () => {
  await repo.upsert(env, UID, 1, 'mine', null);
  await repo.upsert(env, OTHER, 1, 'theirs', null);

  await repo.remove(env, UID);
  expect(await repo.get(env, UID)).toBeNull();
  expect(await repo.get(env, OTHER)).not.toBeNull();
});
