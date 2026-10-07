import type { Env, Session, StoreView, Tokens } from '../types.ts';
import { dataHeaders } from './auth.ts';
import { rf } from './http.ts';
import { ownedSet } from './owned.ts';
import { storeBase } from './shard.ts';
import { markOwned, markable, shape } from './store.ts';

/** Tokens + session -> the finished store view. Everything Riot-facing for this
 *  path lives here; the caller handles caching and persistence. */
export async function fetchStore(env: Env, s: Session, t: Tokens): Promise<StoreView> {
  const puuid = s.puuid as string;
  const h = await dataHeaders(env, t);
  const base = storeBase(s.shard as string);

  const [sfRes, wRes] = await Promise.all([
    rf(base + 'v3/storefront/' + puuid, {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: '{}',
    }),
    rf(base + 'v1/wallet/' + puuid, { headers: h }),
  ]);

  if (!sfRes.ok) {
    // The body goes to the log, never to the client: it echoes request details back.
    console.log('storefront rejected: ' + sfRes.status);
    throw new Error('storefront ' + sfRes.status);
  }

  const view = shape(await sfRes.json(), wRes.ok ? await wRes.json() : null);

  const types = [...new Set(markable(view).flatMap((g) => g.items.map((i) => i.type)))];
  if (types.length) markOwned(view, await ownedSet(h, base, puuid, types));

  return view;
}
