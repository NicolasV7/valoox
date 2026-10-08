// What tier a skin is, worked out from what it costs.
//
// Pinned rather than fetched. The uuids and the token names match
// /v1/contenttiers exactly, and pinning them is what buys the zero requests on
// the screen that has to open fastest.
//
// Its own file because it is a different job from the rest of data/: nothing
// here resolves an id against anything. It is a table and one lookup.

export type TierName = 'select' | 'deluxe' | 'premium' | 'exclusive' | 'ultra';

export interface Tier {
  name: TierName;
  icon: string;
}

const UUID: Record<TierName, string> = {
  select: '12683d76-48d7-84a3-4e09-6985794f0445',
  deluxe: '0cebb8be-46d7-c12a-d306-e9907bfc5a25',
  premium: '60bca009-4182-7998-dee7-b8a2558dc369',
  exclusive: 'e046854e-406c-37f4-6607-19a9ba8426fc',
  ultra: '411e4a55-4e59-7757-41f0-86a53f101bb5',
};

/** Served from this origin, like the coins: five symbols that never change and
 *  turn up on every row, slot and offer. scripts/art.mjs fetches them. */
const tier = (name: TierName): Tier => ({ name, icon: '/art/tier-' + name + '.png' });

/** Riot prices a skin by its tier, and a melee at twice the gun price. Reading
 *  the tier back off the number is what avoids downloading an index to learn
 *  one word. An unknown price returns null, and the row shows no tier at all —
 *  which is honest: we do not know it. */
const BY_PRICE = new Map<number, Tier>(
  (
    [
      [875, 1750, 'select'],
      [1275, 2550, 'deluxe'],
      [1775, 3550, 'premium'],
      [2175, 4350, 'exclusive'],
      [2475, 4950, 'ultra'],
    ] as Array<[number, number, TierName]>
  ).flatMap(([gun, melee, name]) => [
    [gun, tier(name)],
    [melee, tier(name)],
  ]),
);

export const tierByPrice = (cost: number | null): Tier | null =>
  cost === null ? null : (BY_PRICE.get(cost) ?? null);

/** The reverse lookup: Riot's content tier uuid -> the tier. Null for a skin
 *  with no tier at all, which is every default and every battle-pass one — and
 *  is how a bare collection slot is told apart from a dressed one. */
const BY_UUID = new Map<string, Tier>(
  (Object.entries(UUID) as Array<[TierName, string]>).map(([name, id]) => [id, tier(name)]),
);

export const tierOf = (uuid: string | null): Tier | null =>
  uuid ? (BY_UUID.get(uuid) ?? null) : null;
