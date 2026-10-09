import type { Env, Jar, Session } from '../types.ts';
import { SCAN_TTL } from './constants.ts';
import * as repo from './repo.ts';
import { CURRENT_KID, open, SealBroken, seal } from './seal.ts';

// Everything that persists, behind one module. Sessions are sealed rows in D1;
// the two caches are KV, both keyed by uid so nothing is ever shared between
// people — that was the flaw in the single-user version, and it needed no
// attacker to fire.

export interface Held {
  session: Session;
  ver: number;
  kid: number;
  /** What the row said before this request wrote to it, in seconds. The
   *  Account screen dates the session with it; everything else ignores it. */
  seen?: number;
}

/**
 * The row, opened — or null, which every caller already turns into "scan
 * again".
 *
 * A blob that will not open is handled here rather than thrown, and that is
 * the whole of the kill switch. `npx wrangler secret put JAR_KEY` leaves every
 * browser holding its uid cookie and its row; without this, the next request
 * threw SealBroken, nothing caught it, the router answered 502, and the page
 * rendered "Riot did not answer" with a Retry that could never work — on a
 * screen with no tabs, so the one call that would have cleared the row was
 * unreachable. CLAUDE.md says a rotation signs everybody out. It bricked them.
 *
 * Deleting on a failed open is safe because AES-GCM does not fail transiently:
 * a rotated key, a row moved between uids and a corrupted blob are the only
 * causes and all three are permanent. The row was dead either way; this makes
 * it say so in the same request instead of in ten days, when prune runs.
 */
export async function readSession(env: Env, uid: string): Promise<Held | null> {
  const row = await repo.get(env, uid);
  if (!row) return null;
  let session: Session;
  try {
    session = await open<Session>(env, uid, row.kid, row.blob);
  } catch (e) {
    if (!(e instanceof SealBroken)) throw e;
    await forget(env, uid);
    return null;
  }
  return { session, ver: row.ver, kid: row.kid, seen: row.last_used };
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
  return repo.update(env, uid, CURRENT_KID, await seal(env, uid, CURRENT_KID, s), ver);
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
const VERSION: Record<Cache, number> = { store: 3, inv: 2 };

/**
 * Which JAR_KEY these entries belong to — eight hex of its SHA-256, cached on
 * the raw secret like every other derivation in the vault.
 *
 * The cache is read before D1 is touched, so without this a rotated key left
 * every browser still holding its uid cookie receiving that account's store
 * view, Riot name and rank for the rest of the rotation window. The kill switch
 * has to take effect immediately — a kill switch with a lag is not one — and
 * changing the key changes every cache key, so the old entries become
 * unreachable in the same request and expire on their own TTL.
 */
let era: { raw: string; tag: Promise<string> } | null = null;

function epoch(env: Env): Promise<string> {
  if (era?.raw !== env.JAR_KEY) {
    era = {
      raw: env.JAR_KEY,
      tag: crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(env.JAR_KEY))
        .then((d) =>
          [...new Uint8Array(d).slice(0, 4)].map((b) => b.toString(16).padStart(2, '0')).join(''),
        ),
    };
  }
  return era.tag;
}

const key = async (env: Env, name: Cache, uid: string) =>
  name + VERSION[name] + ':' + (await epoch(env)) + ':' + uid;

/**
 * Sealed, like the row.
 *
 * What is in here is a store view: the Riot game name, the tag, the rank, the
 * shard and today's offers. schema.sql says a raw dump reveals no Riot
 * identity, and that was true of D1 and not of KV, which has no per-row
 * encryption boundary and held all of it as JSON. The key is the same per-uid
 * subkey the row uses, so a KV dump is now the same kind of nothing.
 *
 * A failed open is a cache MISS, not an error: a bumped CURRENT_KID, a bent
 * value, anything. The caller refetches, which is what it does for an expired
 * entry anyway.
 */
export async function readCache(env: Env, name: Cache, uid: string): Promise<unknown | null> {
  const raw = await env.VAL.get(await key(env, name, uid));
  if (!raw) return null;
  try {
    return await open<unknown>(env, uid, CURRENT_KID, raw);
  } catch {
    return null;
  }
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
  await env.VAL.put(await key(env, name, uid), await seal(env, uid, CURRENT_KID, view), {
    expirationTtl: Math.max(60, ttl),
  });
}

export async function clearCache(env: Env, uid: string): Promise<void> {
  const [store, inv] = await Promise.all([key(env, 'store', uid), key(env, 'inv', uid)]);
  await Promise.all([env.VAL.delete(store), env.VAL.delete(inv)]);
}
