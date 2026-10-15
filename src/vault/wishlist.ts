import * as repo from '../storage/rows.ts';
import * as lists from '../storage/wishlists.ts';
import type { Env, Session, Starred } from '../types.ts';
import { CURRENT_KID, open, seal } from './seal.ts';
import { sessionShape } from './shape.ts';
import { markOf } from './who.ts';

/** Read only after the caller has authenticated and decrypted its own Riot identity. */
export async function load(env: Env, uid: string, acct: string, seed: Starred[]) {
  let row = await lists.read(env, acct);
  if (!row) {
    const items = [...seed];
    for (const peer of await repo.accountRows(env, acct, false)) {
      if (peer.uid === uid || peer.kid !== CURRENT_KID) continue;
      try {
        const previous = await open<Session>(env, peer.uid, peer.kid, peer.blob);
        if (sessionShape(previous) && (await markOf(env, previous.puuid)) === acct) {
          items.push(...(previous.wishlist ?? []));
        }
      } catch {
        /* An unreadable peer cannot contribute preferences. */
      }
    }
    const unique = [
      ...new Map(
        items.filter((item) => item && typeof item.id === 'string').map((item) => [item.id, item]),
      ).values(),
    ];
    let guns = 0;
    let bits = 0;
    // Legacy entries were sealed by this service; retain their metadata and original timestamps.
    const wishlist = unique.filter((item) =>
      !item.type || item.type === 'e7c63390-eda7-46e0-bb7a-a6abdacd2433'
        ? ++guns <= 50
        : ++bits <= 100,
    );
    await lists.create(
      env,
      uid,
      acct,
      CURRENT_KID,
      await seal(env, acct, CURRENT_KID, wishlist, 'wishlist:1'),
      wishlist.length,
    );
    row = await lists.read(env, acct);
  }
  if (!row) throw new Error('wishlist authority changed');
  const wishlist = await open<Starred[]>(env, acct, row.kid, row.blob, 'wishlist:1');
  if (!Array.isArray(wishlist)) throw new Error('wishlist shape is invalid');
  return { wishlist, ver: row.ver };
}

export async function save(env: Env, uid: string, acct: string, ver: number, wishlist: Starred[]) {
  return lists.write(
    env,
    uid,
    acct,
    ver,
    await seal(env, acct, CURRENT_KID, wishlist, 'wishlist:1'),
    wishlist.length,
  );
}
