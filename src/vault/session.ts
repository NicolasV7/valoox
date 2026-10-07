import type { Env, Jar, Session } from '../types.ts';
import { SCAN_TTL } from './constants.ts';
import * as repo from './repo.ts';
import { CURRENT_KID, open, seal } from './seal.ts';

// Everything that persists, behind one module. Sessions are sealed rows in D1;
// the two caches are KV, both keyed by uid so nothing is ever shared between
// people — that was the flaw in the single-user version, and it needed no
// attacker to fire.

export interface Held {
  session: Session;
  ver: number;
  kid: number;
}

export async function readSession(env: Env, uid: string): Promise<Held | null> {
  const row = await repo.get(env, uid);
  if (!row) return null;
  const session = await open<Session>(env, uid, row.kid, row.blob);
  return { session, ver: row.ver, kid: row.kid };
}

export async function createSession(env: Env, uid: string, s: Session): Promise<void> {
  await repo.upsert(env, uid, CURRENT_KID, await seal(env, uid, CURRENT_KID, s));
}

/**
 * Persist a rolled-forward jar. Returns false when another tab got there first,
 * which is not an error — that tab's jar is the live one and ours is stale, so
 * the correct response is to drop ours silently.
 *
 * Always re-seals under CURRENT_KID, so a key rotation migrates every active
 * session for free within one session lifetime. No re-encryption job.
 */
export async function saveSession(
  env: Env,
  uid: string,
  s: Session,
  ver: number,
): Promise<boolean> {
  return repo.update(env, uid, await seal(env, uid, CURRENT_KID, s), ver);
}

/** Forget this browser. Revokes OUR access — the jar keeps working at Riot until
 *  it expires on its own, which is why the button must never just say "revoked". */
export async function forget(env: Env, uid: string): Promise<void> {
  await Promise.all([repo.remove(env, uid), clearCache(env, uid)]);
}

// --- the in-progress QR scan ------------------------------------------------
// Keyed by the same uid the browser already holds, so two people scanning at the
// same moment can never complete each other's sign-in.

export async function readScan(env: Env, uid: string): Promise<Jar | null> {
  const raw = await env.VAL.get('scan:' + uid);
  return raw ? (JSON.parse(raw) as Jar) : null;
}

export async function writeScan(env: Env, uid: string, jar: Jar): Promise<void> {
  await env.VAL.put('scan:' + uid, JSON.stringify(jar), { expirationTtl: SCAN_TTL });
}

export async function clearScan(env: Env, uid: string): Promise<void> {
  await env.VAL.delete('scan:' + uid);
}

// --- the store cache --------------------------------------------------------

/** Cache names. Both are per-uid: nothing is ever shared between two people. */
export type Cache = 'store' | 'inv';

/**
 * Bump the number when the cached SHAPE changes.
 *
 * Without this, a deploy that renames a field serves the old shape from cache
 * until the TTL runs out, and the page renders empty with no error anywhere —
 * which is exactly what happened when the inventory grew from `owned` to
 * `byType`. Old versions simply expire; nothing needs migrating.
 */
const VERSION: Record<Cache, number> = { store: 2, inv: 2 };

const key = (name: Cache, uid: string) => name + VERSION[name] + ':' + uid;

export async function readCache(env: Env, name: Cache, uid: string): Promise<unknown | null> {
  const raw = await env.VAL.get(key(name, uid));
  return raw ? JSON.parse(raw) : null;
}

/** For the store, the TTL is the rotation timer Riot itself returns, so the cache
 *  expires exactly when the data does and no scheduled job is needed. KV's floor
 *  is 60s. */
export async function writeCache(
  env: Env,
  name: Cache,
  uid: string,
  view: unknown,
  ttl: number,
): Promise<void> {
  await env.VAL.put(key(name, uid), JSON.stringify(view), { expirationTtl: Math.max(60, ttl) });
}

export async function clearCache(env: Env, uid: string): Promise<void> {
  await Promise.all([env.VAL.delete(key('store', uid)), env.VAL.delete(key('inv', uid))]);
}
