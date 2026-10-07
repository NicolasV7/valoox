import type { Env } from '../types.ts';

// The only module that talks to D1.
//
// Strongly consistent by construction: plain prepare(), never the Sessions API.
// withSession() would reintroduce a window where a revoked session still reads
// live — which for a credential that bypasses 2FA is exactly the wrong trade.

export interface Row {
  uid: string;
  kid: number;
  blob: string;
  ver: number;
}

const now = () => Math.floor(Date.now() / 1000);

export async function get(env: Env, uid: string): Promise<Row | null> {
  return env.DB.prepare('SELECT uid, kid, blob, ver FROM s WHERE uid = ?').bind(uid).first<Row>();
}

/**
 * Sign-in. Upsert rather than insert: a browser whose session expired still holds
 * its uid cookie AND its dead row, so the second sign-in from that browser would
 * hit `UNIQUE constraint failed: s.uid` — breaking re-entry at exactly the moment
 * the user has no working session to fall back on. Confirmed against D1.
 *
 * ver resets to 0 because the caller's follow-up save is pinned to 0.
 */
export async function upsert(env: Env, uid: string, kid: number, blob: string): Promise<void> {
  const t = now();
  await env.DB.prepare(
    'INSERT INTO s (uid, kid, blob, ver, created_at, last_used) VALUES (?, ?, ?, 0, ?, ?) ' +
      'ON CONFLICT(uid) DO UPDATE SET kid = excluded.kid, blob = excluded.blob, ver = 0, last_used = excluded.last_used',
  )
    .bind(uid, kid, blob, t, t)
    .run();
}

/**
 * Compare-and-swap. Two tabs refreshing at once both roll the jar forward; the
 * loser must re-read rather than overwrite, or it persists a jar Riot has already
 * superseded and the session dies early. Returns false when someone else won.
 */
export async function update(env: Env, uid: string, blob: string, ver: number): Promise<boolean> {
  const r = await env.DB.prepare(
    'UPDATE s SET blob = ?, ver = ver + 1, last_used = ? WHERE uid = ? AND ver = ?',
  )
    .bind(blob, now(), uid, ver)
    .run();
  return r.meta.changes > 0;
}

/** The rows the alert job polls. `alerts` is the only plaintext preference in the
 *  table, and it says nothing beyond "this browser asked to be told". */
export async function listAlerting(env: Env): Promise<Row[]> {
  const r = await env.DB.prepare('SELECT uid, kid, blob, ver FROM s WHERE alerts = 1').all<Row>();
  return r.results ?? [];
}

export async function setAlerts(env: Env, uid: string, on: boolean): Promise<void> {
  await env.DB.prepare('UPDATE s SET alerts = ? WHERE uid = ?')
    .bind(on ? 1 : 0, uid)
    .run();
}

export async function remove(env: Env, uid: string): Promise<void> {
  await env.DB.prepare('DELETE FROM s WHERE uid = ?').bind(uid).run();
}

/** Abandoned rows are the ones that would sit in a stale dump. Deleting them
 *  beats shortening their life: they are gone, not merely shorter-lived. */
export async function prune(env: Env, olderThanDays = 10): Promise<number> {
  const r = await env.DB.prepare('DELETE FROM s WHERE last_used < ?')
    .bind(now() - olderThanDays * 86400)
    .run();
  return r.meta.changes;
}
