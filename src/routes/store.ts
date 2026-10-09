import type { Body, Ctx } from '../lib/json.ts';
import { EXPIRED, RESEED } from '../lib/json.ts';
import type { StoreView } from '../types.ts';
import { live } from '../vault/live.ts';
import { readCache, writeCache } from '../vault/session.ts';
import { fetchStore } from '../vault/storefront.ts';

/**
 * Today's store.
 *
 * The cache lives exactly as long as the data does: Riot's payload carries its
 * own `remaining`, and that is the TTL. So the entry expires at the moment the
 * store rotates, with nothing scheduled and nothing to invalidate.
 */
export async function store({ env, uid }: Ctx): Promise<Body> {
  const hit = (await readCache(env, 'store', uid)) as StoreView | null;
  if (hit) return hit as unknown as Body;

  const s = await live(env, uid);
  if (!s) return RESEED;
  // A row Riot has just refused is a different screen from never having
  // scanned, and the only place that distinction exists is here.
  if (s === 'gone') return EXPIRED;

  const view = await fetchStore(env, s.session, s.t, { seen: s.seen });
  await writeCache(env, 'store', uid, view, view.remaining);
  return view as unknown as Body;
}
