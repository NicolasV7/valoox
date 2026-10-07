import type { Env, Session, Tokens } from '../types.ts';
import { dataHeaders } from './auth.ts';
import { ownedAll } from './owned.ts';
import { storeBase } from './shard.ts';

export interface Inventory {
  /** itemTypeId -> the ids owned of that type. Skins, sprays, buddies, cards,
   *  titles, agents — whatever Riot groups. Owning one skin lists its base plus
   *  each level and chroma separately, so these are larger than they look. */
  byType: Record<string, string[]>;
  fetchedAt: number;
}

/**
 * One call, one item type. The join that turns these UUIDs into names, pictures
 * and prices happens in the BROWSER against valorant-api.com: that catalogue is
 * 3.5 MB and parsing it here would blow the 10 ms CPU budget every time. This is
 * a permanent boundary, not an optimisation to revisit.
 */
export async function fetchInventory(env: Env, s: Session, t: Tokens): Promise<Inventory> {
  const h = await dataHeaders(env, t);
  const byType = await ownedAll(h, storeBase(s.shard as string), s.puuid as string);
  return { byType, fetchedAt: Math.floor(Date.now() / 1000) };
}
