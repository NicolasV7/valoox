// What Riot's store can ever draw from.
//
// The content tier does not answer this. A Premium skin is not necessarily
// buyable — most of the battle pass and every event reward carries a tier and
// is never sold — and that was the whole reason a starred skin could sit in
// the list for a year without firing. /store/v1/offers/ is Riot's own answer:
// the fixed set of offers the daily panel and the accessory shop are built
// from. A skin not in it cannot turn up, so the wishlist will not hold it.
//
// The one read in this app with no uuid anywhere in its path, which is what
// makes it shareable: the list is the same for every account, so it is fetched
// once a day for everybody and kept under one key. That matters more than it
// sounds — it means a search screen filters against something the Worker did
// not have to fetch per person, per request, inside a 10ms budget.

import type { Env, Session, Tokens } from '../types.ts';
import { dataHeaders } from './auth.ts';
import { rf } from './http.ts';
import { storeBase } from './shard.ts';

/** One day. Riot adds to this list on a patch, which is weeks apart; a stale
 *  entry costs at worst a skin missing from the search for a few hours. */
const TTL = 86_400;

/** Bumped when the shape changes, exactly as the per-uid caches are. */
const KEY = 'sells2';

interface Offer {
  OfferID?: string;
  Rewards?: Array<{ ItemID?: string }>;
}

/**
 * Every item id the store can offer, as a sorted list.
 *
 * `Rewards[0].ItemID` and not `OfferID`: for a skin they are the same uuid,
 * but for an accessory the offer id is the offer's own and the item id is the
 * spray. store.ts reads the storefront the same way round, so the two sets are
 * comparable — which is the only thing this is for.
 */
export async function sells(env: Env, s: Session, t: Tokens): Promise<string[]> {
  const hit = await env.VAL.get(KEY);
  if (hit) return JSON.parse(hit) as string[];

  const h = await dataHeaders(env, t);
  const res = await rf(storeBase(s.shard as string) + 'v1/offers/', { headers: h });
  if (!res.ok) {
    console.log('offers rejected: ' + res.status);
    throw new Error('offers ' + res.status);
  }

  const body = (await res.json()) as { Offers?: Offer[] };
  const ids = [
    ...new Set((body.Offers ?? []).map((o) => o.Rewards?.[0]?.ItemID ?? o.OfferID ?? '')),
  ]
    .filter(Boolean)
    .sort();

  await env.VAL.put(KEY, JSON.stringify(ids), { expirationTtl: TTL });
  return ids;
}
