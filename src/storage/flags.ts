import type { Env } from '../types.ts';

/** Shared list size and browser-specific consent decide the job flag in the same write. */
export const ACTIVE =
  'CASE WHEN EXISTS(SELECT 1 FROM wishlists WHERE acct=?) ' +
  'THEN (? AND (SELECT total>0 FROM wishlists WHERE acct=?)) ELSE ? END';

export async function sync(
  env: Env,
  uid: string,
  ver: number,
  acct: string | null,
  receiving: boolean,
  alerts: boolean,
): Promise<void> {
  await env.DB.prepare(
    'UPDATE s SET acct=?,receiving=?,alerts=' + ACTIVE + ' WHERE uid=? AND ver=?',
  )
    .bind(acct, +receiving, acct, +receiving, acct, +alerts, uid, ver)
    .run();
}
