import { expiresAt } from '../lib/expiry.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { EXPIRED, RESEED } from '../lib/json.ts';
import type { StoreView } from '../types.ts';
import { live } from '../vault/live.ts';
import { readCache, writeCache } from '../vault/session.ts';
import { fetchStore } from '../vault/storefront.ts';

/**
 * Today's store.
 *
 * Daily offers, bundles, accessories and Night Market rotate independently.
 * Cache until the first deadline; cache reads also check the payload because
 * KV eviction alone cannot guarantee freshness across locations.
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
  const ttl = Math.max(0, Math.ceil((expiresAt(view) - Date.now()) / 1000));
  if (!(await writeCache(env, 'store', uid, view, ttl))) return RESEED;
  return view as unknown as Body;
}
