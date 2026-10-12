import type { Env } from '../types.ts';
import { change, now } from './rows.ts';

export interface Code {
  id: string;
  recipient: string;
  hash: string;
  expires: number;
  attempts: number;
  used: number;
}
export const read = (env: Env, uid: string) =>
  env.DB.prepare('SELECT id,recipient,hash,expires,attempts,used FROM otp WHERE uid=?')
    .bind(uid)
    .first<Code>();

export async function reserve(
  env: Env,
  uid: string,
  ver: number,
  value: { kid: number; blob: string; acct: string | null; alerts: boolean },
  otp: Omit<Code, 'attempts' | 'used'>,
): Promise<boolean> {
  const r = await env.DB.batch([
    change(env, uid, value.kid, value.blob, ver, value.acct, value.alerts),
    env.DB.prepare(
      'INSERT INTO otp(uid,id,recipient,hash,expires) ' +
        'SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=? AND blob=?) ' +
        'ON CONFLICT(uid) DO UPDATE SET id=excluded.id,recipient=excluded.recipient,' +
        'hash=excluded.hash,expires=excluded.expires,attempts=0,used=0,claim=NULL',
    ).bind(uid, otp.id, otp.recipient, otp.hash, otp.expires, uid, ver + 1, value.blob),
    env.DB.prepare(
      'INSERT INTO messages(id,uid,gen,expires) SELECT ?,?,?,? ' +
        'WHERE EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=? AND blob=?)',
    ).bind(otp.id, uid, otp.id, now() + 604800, uid, ver + 1, value.blob),
  ]);
  return (r[0]?.meta.changes ?? 0) > 0;
}

/** Counter, consumption and the sealed verified flag are one transaction. */
export async function attempt(
  env: Env,
  uid: string,
  gen: string,
  recipient: string,
  hash: string,
  ver: number,
  verified: D1PreparedStatement,
  claim: string,
): Promise<'ok' | 'wrong' | 'spent' | 'gone' | 'conflict'> {
  const r = await env.DB.batch([
    env.DB.prepare(
      'UPDATE otp SET attempts=attempts+1,used=CASE WHEN hash=? THEN 1 ELSE 0 END,' +
        'claim=CASE WHEN hash=? THEN ? ELSE NULL END ' +
        'WHERE uid=? AND id=? AND recipient=? AND expires>? AND used=0 AND attempts<5 ' +
        'AND EXISTS(SELECT 1 FROM s WHERE uid=? AND ver=?) RETURNING attempts,used',
    ).bind(hash, hash, claim, uid, gen, recipient, now(), uid, ver),
    verified,
  ]);
  if ((r[1]?.meta.changes ?? 0) > 0) return 'ok';
  const result = r[0]?.results[0] as { used: number; attempts: number } | undefined;
  if (result) return result.attempts >= 5 ? 'spent' : 'wrong';
  const row = await read(env, uid);
  if (!row || row.id !== gen || row.expires <= now() || row.used) return 'gone';
  if (row.attempts >= 5) return 'spent';
  return 'conflict';
}
export async function clear(env: Env, uid: string, gen: string): Promise<void> {
  await env.DB.prepare('DELETE FROM otp WHERE uid=? AND id=?').bind(uid, gen).run();
}
