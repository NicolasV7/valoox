import type { Body, Ctx } from '../lib/json.ts';
import { EXPIRED, RESEED } from '../lib/json.ts';
import { fetchInventory, type Inventory } from '../vault/inventory.ts';
import { live } from '../vault/live.ts';
import { readCache, writeCache } from '../vault/session.ts';

/** An inventory changes only when you buy something. An hour is plenty, and it
 *  keeps a tab refresh from costing a full Riot round trip. */
const TTL = 3600;

export async function collection({ env, uid }: Ctx): Promise<Body> {
  const hit = (await readCache(env, 'inv', uid)) as Inventory | null;
  if (hit) return hit as unknown as Body;

  const s = await live(env, uid);
  if (!s) return RESEED;
  // A row Riot has just refused is a different screen from never having
  // scanned, and the only place that distinction exists is here.
  if (s === 'gone') return EXPIRED;

  const inv = await fetchInventory(env, s.session, s.t);
  await writeCache(env, 'inv', uid, inv, TTL);
  return inv as unknown as Body;
}
