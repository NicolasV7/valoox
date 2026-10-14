import type { Env, Session } from '../types.ts';
import { clearCache } from './evict.ts';
import * as repo from './repo.ts';
import { CURRENT_KID, open, SealBroken, seal } from './seal.ts';
import { sessionShape } from './shape.ts';
import { markOf } from './who.ts';

export interface Held {
  session: Session;
  ver: number;
  kid: number;
  seen?: number;
}
export const alerting = (s: Session) => !!s.wishlist?.length && s.mail?.ok === true;

/** Drop obsolete notification preferences before returning or resealing a row. */
function preferences(s: Session): Session {
  const current = { ...s } as Session & { notify?: unknown };
  delete current.notify;
  return current;
}

export async function readSession(env: Env, uid: string): Promise<Held | null> {
  const row = await repo.get(env, uid);
  if (!row) return null;
  try {
    const session = preferences(await open<Session>(env, uid, row.kid, row.blob));
    if (!sessionShape(session)) throw new SealBroken();
    return { session, ver: row.ver, kid: row.kid, seen: row.last_used };
  } catch (e) {
    if (!(e instanceof SealBroken)) throw e;
    await forget(env, uid);
    return null;
  }
}

/** Preferences and the cron flag are one atomic write. */
export async function encoded(env: Env, uid: string, s: Session) {
  const [blob, acct] = await Promise.all([
    seal(env, uid, CURRENT_KID, preferences(s)),
    markOf(env, s.puuid),
  ]);
  return { kid: CURRENT_KID, blob, acct, alerts: alerting(s) };
}

export async function prepared(
  env: Env,
  uid: string,
  s: Session,
  ver: number,
  guard?: { sql: string; values: (string | number)[] },
) {
  const value = await encoded(env, uid, s);
  return repo.change(env, uid, value.kid, value.blob, ver, value.acct, value.alerts, guard);
}

export async function createSession(env: Env, uid: string, s: Session): Promise<void> {
  const value = await encoded(env, uid, s);
  await repo.upsert(env, uid, value.kid, value.blob, value.acct, value.alerts);
}

export async function saveSession(
  env: Env,
  uid: string,
  s: Session,
  ver: number,
): Promise<boolean> {
  return (await (await prepared(env, uid, s, ver)).run()).meta.changes > 0;
}

/** Deletes our access and pending QR; Riot's own session expires independently. */
export async function forget(env: Env, uid: string): Promise<void> {
  await repo.remove(env, uid);
  // D1 revocation is authoritative; eventual cache cleanup cannot undo it.
  await clearCache(env, uid).catch(() => undefined);
}
