import type { RiotHeaders } from '../types.ts';
import { rf } from './http.ts';

/** The item type id for weapon skins. Entitlements are queried per TYPE, never
 *  per item — per item would be hundreds of calls for one page. */
export const SKINS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

/** The free plan allows 6 simultaneous outgoing connections awaiting headers;
 *  a bundle can span more item types than that, so the fan-out is capped below it. */
const FANOUT = 4;

export async function ownedOf(
  h: RiotHeaders,
  base: string,
  puuid: string,
  type: string,
): Promise<string[]> {
  const res = await rf(base + 'v1/entitlements/' + puuid + '/' + type, { headers: h });
  if (!res.ok) return [];
  const d = (await res.json()) as {
    Entitlements?: Array<{ ItemID: string }>;
    EntitlementsByTypes?: Array<{ Entitlements?: Array<{ ItemID: string }> }>;
  };
  const list = d.Entitlements ?? (d.EntitlementsByTypes ?? []).flatMap((g) => g.Entitlements ?? []);
  return list.map((e) => e.ItemID);
}

export async function ownedSet(
  h: RiotHeaders,
  base: string,
  puuid: string,
  types: string[],
): Promise<Set<string>> {
  const out = new Set<string>();
  for (let i = 0; i < types.length; i += FANOUT) {
    const batch = await Promise.all(
      types.slice(i, i + FANOUT).map((t) => ownedOf(h, base, puuid, t)),
    );
    for (const ids of batch) for (const id of ids) out.add(id);
  }
  return out;
}

/**
 * Everything the account owns, grouped by item type, in ONE call.
 *
 * Better than iterating a hardcoded list of type UUIDs: the types come back from
 * Riot rather than from our memory of them, which is how the buddy type got
 * mislabelled as chromas the first time around.
 */
export async function ownedAll(
  h: RiotHeaders,
  base: string,
  puuid: string,
): Promise<Record<string, string[]>> {
  const res = await rf(base + 'v1/entitlements/' + puuid, { headers: h });
  if (!res.ok) throw new Error('entitlements ' + res.status);
  const d = (await res.json()) as {
    EntitlementsByTypes?: Array<{ ItemTypeID: string; Entitlements?: Array<{ ItemID: string }> }>;
  };
  const out: Record<string, string[]> = {};
  for (const g of d.EntitlementsByTypes ?? []) {
    out[g.ItemTypeID] = (g.Entitlements ?? []).map((e) => e.ItemID);
  }
  return out;
}
