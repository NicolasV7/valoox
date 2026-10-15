import { pending } from '../alerts/otp.ts';
import { preferences } from '../discord/prefs.ts';
import { readJson } from '../lib/body.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import { mergeWishlist } from '../lib/wishlist.ts';
import type { Env } from '../types.ts';
import { readSession, saveSession } from '../vault/session.ts';
import { markOf } from '../vault/who.ts';
import { save } from '../vault/wishlist.ts';

export { cleanWishlist } from '../lib/wishlist.ts';

export const readWishlist = ({ env, uid }: Ctx): Promise<Body> => wishlist(env, uid, null);

export const writeWishlist = async ({ env, uid, req }: Ctx): Promise<Body> => {
  if (!(await readSession(env, uid))) return RESEED;
  return wishlist(env, uid, await readJson(req, 98304));
};

async function wishlist(env: Env, uid: string, body: unknown | null, retry = true): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const { session, ver } = held;

  if (body !== null) {
    session.wishlist = mergeWishlist(body, session.wishlist ?? []);
    const acct = await markOf(env, session.puuid);
    const ok =
      acct && held.wishlistVer !== undefined
        ? await save(env, uid, acct, held.wishlistVer, session.wishlist)
        : await saveSession(env, uid, session, ver);

    if (!ok) {
      // Another tab wrote first; theirs is the stored session. Re-read once
      // rather than overwrite, and say so if it happens twice.
      if (retry) return wishlist(env, uid, body, false);
      return { conflict: true };
    }
  }
  return {
    ...(await preferences(env, uid, session)),
    wishlist: session.wishlist ?? [],
    // The address itself, never a code and never a secret: the browser needs
    // it to show you what it is about to write to. `said` is the provider's
    // own last word, passed through unchanged so no screen can soften it.
    mail: session.mail
      ? { to: session.mail.to, ok: session.mail.ok, said: session.mail.said ?? '' }
      : null,
    // Whether six digits are already sitting in that mailbox. A screen that
    // did not know this offered to send a second one beside the first.
    code: await pending(env, uid),
  };
}
