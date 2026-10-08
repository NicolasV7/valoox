import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import { live } from '../vault/live.ts';
import { sells } from '../vault/sells.ts';

/**
 * The set the wishlist is allowed to hold.
 *
 * Behind a session even though the answer is the same for everybody, because
 * the request that produces it needs an entitlements token — there is no
 * unauthenticated way to ask Riot this. The answer itself is shared: one KV
 * entry, one fetch a day, and every signed-in browser reads the same bytes.
 */
export async function sellable({ env, uid }: Ctx): Promise<Body> {
  const s = await live(env, uid);
  if (!s) return RESEED;
  return { ids: await sells(env, s.session, s.t) };
}
