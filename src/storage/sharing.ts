import type { Env } from '../types.ts';

/** The authenticated account index also guards against concurrent logout or account changes. */
export const read = (env: Env, uid: string, acct: string) =>
  env.DB.prepare(
    'SELECT p.kid,p.blob FROM s LEFT JOIN sharing p ON p.acct=s.acct WHERE s.uid=? AND s.acct=?',
  )
    .bind(uid, acct)
    .first<{ kid: number | null; blob: string | null }>();

export async function write(env: Env, uid: string, acct: string, kid: number, blob: string) {
  const result = await env.DB.prepare(
    'INSERT INTO sharing(acct,kid,blob) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM s WHERE uid=? AND acct=?) ' +
      'ON CONFLICT(acct) DO UPDATE SET kid=excluded.kid,blob=excluded.blob',
  )
    .bind(acct, kid, blob, uid, acct)
    .run();
  return result.meta.changes > 0;
}
