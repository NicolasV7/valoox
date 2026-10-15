import type { Env } from '../types.ts';
import { change } from './rows.ts';

export const read = (env: Env, uid: string) =>
  env.DB.prepare('SELECT gen,state FROM discord WHERE uid=?')
    .bind(uid)
    .first<{ gen: string; state: string }>();

/** A Discord user can stop every linked browser without decrypting all sessions. */
export async function stop(env: Env, recipient: string): Promise<void> {
  await env.DB.batch([
    env.DB.prepare('DELETE FROM links WHERE recipient=?').bind(recipient),
    env.DB.prepare("UPDATE discord SET state='stopped' WHERE recipient=?").bind(recipient),
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
  value: { kid: number; blob: string; acct: string | null; alerts: boolean },
): Promise<boolean> {
  const guard = ' AND EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=? AND blob=?)';
  const result = await env.DB.batch([
    change(env, uid, value.kid, value.blob, ver, value.acct, value.alerts),
    env.DB.prepare('DELETE FROM discord WHERE uid=?' + guard).bind(uid, uid, ver + 1, value.blob),
    env.DB.prepare('DELETE FROM links WHERE uid=?' + guard).bind(uid, uid, ver + 1, value.blob),
  ]);
  return (result[0]?.meta.changes ?? 0) > 0;
}
