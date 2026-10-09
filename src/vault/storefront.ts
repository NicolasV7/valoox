import type { Env, Session, StoreView, Tokens } from '../types.ts';
import { fetchRank } from './account.ts';
import { dataHeaders } from './auth.ts';
import { rf } from './http.ts';
import { fetchLoadout } from './loadout.ts';
import { ownedSet } from './owned.ts';
import { storeBase } from './shard.ts';
import { markable, markOwned, shape } from './store.ts';

/** What an item type looks like when Riot actually sent one. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Tokens + session -> the finished store view. Everything Riot-facing for this
 *  path lives here; the caller handles caching and persistence. */
export async function fetchStore(
  env: Env,
  s: Session,
  t: Tokens,
  /** When this row was last written, for the Account screen. Passed in rather
   *  than read here: this file's subject is Riot, and that number is ours. */
  seen?: number,
): Promise<StoreView> {
  const puuid = s.puuid as string;
  const h = await dataHeaders(env, t);
  const base = storeBase(s.shard as string);

  // Four reads in parallel. Rank and card are not store data, but they share the
  // header and the cache lifetime, so fetching them here costs no extra latency.
  const [sfRes, wRes, rank, worn] = await Promise.all([
    rf(base + 'v3/storefront/' + puuid, {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: '{}',
    }),
    rf(base + 'v1/wallet/' + puuid, { headers: h }),
    fetchRank(env, s, t),
    fetchLoadout(env, s, t).catch(() => null),
  ]);

  if (!sfRes.ok) {
    // The body goes to the log, never to the client: it echoes request details back.
    console.log('storefront rejected: ' + sfRes.status);
    throw new Error('storefront ' + sfRes.status);
  }

  const view = shape(await sfRes.json(), wRes.ok ? await wRes.json() : null, undefined, {
    name: s.name ?? '',
    rank,
    card: worn?.card ?? null,
    shard: s.shard as string | undefined,
    seen,
  });

  // Filtered to uuids, because shape() reads ItemTypeID with optional chaining
  // on purpose — surviving a payload change is its whole job — so `undefined`
  // is an expected value here. Concatenated into the entitlements path it
  // became `.../entitlements/<puuid>/undefined`, which assertAllowed refuses
  // by throwing BEFORE fetch, so owned.ts's best-effort handling never ran and
  // the whole store 502'd on exactly the shape change shape() absorbs.
  const types = [...new Set(markable(view).flatMap((g) => g.items.map((i) => i.type)))].filter(
    (t): t is string => typeof t === 'string' && UUID.test(t),
  );
  if (types.length) {
    const owned = await ownedSet(h, base, puuid, types);
    // Left undefined when Riot would not say. `owned?: boolean` has always had
    // the third state in it; it was being thrown away at the door.
    if (owned) markOwned(view, owned);
  }

  return view;
}
