import type { Env } from '../types.ts';

export interface Wishlist {
  kid: number;
  blob: string;
  ver: number;
}
export const read = (env: Env, acct: string) =>
  env.DB.prepare('SELECT kid,blob,ver FROM wishlists WHERE acct=?').bind(acct).first<Wishlist>();

export async function create(
  env: Env,
  uid: string,
  acct: string,
  kid: number,
  blob: string,
  total: number,
) {
  await env.DB.batch([
    env.DB.prepare(
      'INSERT OR IGNORE INTO wishlists(acct,kid,blob,total) SELECT ?,?,?,? ' +
        'WHERE EXISTS(SELECT 1 FROM s WHERE uid=? AND acct=?)',
    ).bind(acct, kid, blob, total, uid, acct),
    env.DB.prepare(
      'UPDATE s SET alerts=(receiving=1 AND ?>0) WHERE acct=? AND ' +
        'EXISTS(SELECT 1 FROM wishlists WHERE acct=? AND blob=?)',
    ).bind(total, acct, acct, blob),
  ]);
}

/** Account authority, list CAS and all browser job flags commit together. */
export async function write(
  env: Env,
  uid: string,
  acct: string,
  ver: number,
  blob: string,
  total: number,
) {
  const guard = 'EXISTS(SELECT 1 FROM wishlists WHERE acct=? AND ver=? AND blob=?)';
  const result = await env.DB.batch([
    env.DB.prepare(
      'UPDATE wishlists SET blob=?,total=?,ver=ver+1 WHERE acct=? AND ver=? ' +
        'AND EXISTS(SELECT 1 FROM s WHERE uid=? AND acct=?)',
    ).bind(blob, total, acct, ver, uid, acct),
    env.DB.prepare('UPDATE s SET alerts=(receiving=1 AND ?>0) WHERE acct=? AND ' + guard).bind(
      total,
      acct,
      acct,
      ver + 1,
      blob,
    ),
    env.DB.prepare(
      'DELETE FROM checks WHERE uid IN (SELECT uid FROM s WHERE acct=?) AND ' + guard,
    ).bind(acct, acct, ver + 1, blob),
  ]);
  return (result[0]?.meta.changes ?? 0) > 0;
}
