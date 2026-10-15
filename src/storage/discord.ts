import type { Env } from '../types.ts';
import { change, now } from './rows.ts';

export const read = (env: Env, uid: string) =>
  env.DB.prepare('SELECT gen,state FROM discord WHERE uid=?')
    .bind(uid)
    .first<{ gen: string; state: string }>();

/** Prefer the newest active link when a Discord user has several Riot accounts. */
export const latest = (env: Env, recipient: string) =>
  env.DB.prepare(
    "SELECT uid FROM discord WHERE recipient=? ORDER BY (state='connected') DESC,since DESC,uid LIMIT 1",
  )
    .bind(recipient)
    .first<{ uid: string }>();

/** A Discord user can stop every linked browser without decrypting all sessions. */
export async function stop(
  env: Env,
  recipient: string,
  before = Number.MAX_SAFE_INTEGER,
): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      'DELETE FROM links WHERE (recipient=? OR uid IN ' +
        '(SELECT uid FROM discord WHERE recipient=? AND since<=?)) AND (expires-600)*1000<=?',
    ).bind(recipient, recipient, before, before),
    env.DB.prepare("UPDATE discord SET state='stopped' WHERE recipient=? AND since<=?").bind(
      recipient,
      before,
    ),
  ]);
}

export async function blocked(env: Env, uid: string, gen: string): Promise<void> {
  await env.DB.prepare(
    "UPDATE discord SET state='blocked' WHERE recipient IN " +
      "(SELECT recipient FROM discord WHERE uid=? AND gen=? AND state='connected')",
  )
    .bind(uid, gen)
    .run();
}

export async function connected(env: Env, recipient: string): Promise<boolean> {
  return !!(await env.DB.prepare("SELECT 1 FROM discord WHERE recipient=? AND state='connected'")
    .bind(recipient)
    .first());
}

/** The encrypted preference, opt-in index and pending code disappear together. */
export async function remove(
  env: Env,
  uid: string,
  ver: number,
  value: { kid: number; blob: string; acct: string | null; alerts: boolean; receiving?: boolean },
): Promise<boolean> {
  const guard = ' AND EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=? AND blob=?)';
  const result = await env.DB.batch([
    change(
      env,
      uid,
      value.kid,
      value.blob,
      ver,
      value.acct,
      value.alerts,
      {
        sql: "NOT EXISTS(SELECT 1 FROM links WHERE uid=? AND state='checking' AND expires>?)",
        values: [uid, now()],
      },
      value.receiving,
    ),
    env.DB.prepare('DELETE FROM discord WHERE uid=?' + guard).bind(uid, uid, ver + 1, value.blob),
    env.DB.prepare('DELETE FROM links WHERE uid=?' + guard).bind(uid, uid, ver + 1, value.blob),
  ]);
  return (result[0]?.meta.changes ?? 0) > 0;
}
