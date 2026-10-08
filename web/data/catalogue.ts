// Riot answers in uuids. This is where they become a name and a picture.
//
// It happens here, in the browser, and never in the Worker: the full catalogue
// is 3.5 MB for weapons alone and a Worker gets 10 ms of CPU per request.
// valorant-api.com sends `Access-Control-Allow-Origin: *`, so the page asks it
// directly and the Worker never sees a byte of it.
//
// The store screen in particular resolves one item at a time rather than
// downloading an index. Four offers is four small requests; the index is 3.5 MB
// on the one screen whose entire job is to be quick.

const V1 = 'https://valorant-api.com/v1/';
const MEDIA = 'https://media.valorant-api.com/';

export interface Piece {
  name: string | null;
  icon: string | null;
}

const seen = new Map<string, Promise<Piece | null>>();

function one(kind: string, id: string): Promise<Piece | null> {
  const key = kind + '/' + id;
  const held = seen.get(key);
  if (held) return held;

  const run = fetch(V1 + key)
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Record<string, string> } | null) => {
      const d = j?.data;
      if (!d) return null;
      return {
        // titleText first: a player title's displayName is the catalogue entry
        // ("Fortune Title") and its titleText is the thing you actually wear
        // ("Fortune"). Nothing else in the catalogue carries the field.
        name: d.titleText || d.displayName || null,
        // A title carries no art at all; a spray prefers the transparent cut.
        icon: d.displayIcon || d.fullTransparentIcon || d.largeArt || null,
      };
    })
    .catch(() => null);

  seen.set(key, run);
  return run;
}

/** The daily store and the night market are always weapon skins. */
export const skin = (id: string) => one('weapons/skinlevels', id);

export const bundle = (id: string) => one('bundles', id);

/** Each item type resolves at exactly one endpoint — probed against live bundle
 *  and accessory data. Buddies sit under buddies/levels, not buddies, and the
 *  uuid commonly labelled "buddy" is actually skin chromas. */
const BY_TYPE: Record<string, string> = {
  'e7c63390-eda7-46e0-bb7a-a6abdacd2433': 'weapons/skinlevels',
  'dd3bf334-87f3-40bd-b043-682a57a8dc3a': 'buddies/levels',
  'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475': 'sprays',
  '3f296c07-64c3-494c-923b-fe692a4fa1bd': 'playercards',
  'de7caa6b-adf7-4588-bbd1-143831e786c6': 'playertitles',
};

/** Which of the four shapes a piece takes. Shape follows the kind of thing,
 *  never the slot it came from — that is what lets a ten-piece bundle and a
 *  random accessory drop share one grid. */
export type Shape = 'row' | 'tile' | 'portrait' | 'text';

const SHAPE: Record<string, Shape> = {
  'e7c63390-eda7-46e0-bb7a-a6abdacd2433': 'row', // a gun
  'dd3bf334-87f3-40bd-b043-682a57a8dc3a': 'tile', // a charm
  'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475': 'tile', // a spray
  '3f296c07-64c3-494c-923b-fe692a4fa1bd': 'portrait', // a card
  'de7caa6b-adf7-4588-bbd1-143831e786c6': 'text', // a title
};

export const shapeOf = (type: string): Shape => SHAPE[type] ?? 'tile';

/** What a piece IS, as a key rather than a word — the word lives in i18n.
 *
 *  Shape and kind are not the same question: a spray and a charm are both
 *  squares and are not the same thing, and "Dragon" inside a bundle is a name
 *  that says nothing at all without one of these under it. */
export type Kind = 'skin' | 'buddy' | 'spray' | 'card' | 'title';

const KIND: Record<string, Kind> = {
  'e7c63390-eda7-46e0-bb7a-a6abdacd2433': 'skin',
  'dd3bf334-87f3-40bd-b043-682a57a8dc3a': 'buddy',
  'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475': 'spray',
  '3f296c07-64c3-494c-923b-fe692a4fa1bd': 'card',
  'de7caa6b-adf7-4588-bbd1-143831e786c6': 'title',
};

export const kindOf = (type: string): Kind | null => KIND[type] ?? null;

export const piece = (type: string, id: string): Promise<Piece | null> =>
  BY_TYPE[type] ? one(BY_TYPE[type] as string, id) : Promise.resolve(null);

/** The icon for a competitive tier, from the table Riot is using right now.
 *
 *  One request, and only the last row of it: Riot publishes a tier table per
 *  episode and renames the art every few of them, so a pinned url rots. The
 *  table is small and the answer is remembered for the life of the page. */
let tiers: Promise<Record<number, string>> | null = null;

export function rankIcon(tier: number): Promise<string | null> {
  tiers ??= fetch(V1 + 'competitivetiers')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Array<{ tiers: Array<{ tier: number; largeIcon: string | null }> }> }) => {
      const now = j?.data?.[j.data.length - 1];
      const map: Record<number, string> = {};
      for (const t of now?.tiers ?? []) if (t.largeIcon) map[t.tier] = t.largeIcon;
      return map;
    })
    .catch(() => ({}));
  return tiers.then((map) => map[tier] ?? null);
}

/** The wide art of the equipped player card, for the header. largeArt is the
 *  fallback because a handful of old cards never got a wide render. */
export const cardArt = (id: string): Promise<string | null> =>
  fetch(V1 + 'playercards/' + id)
    .then((r) => (r.ok ? r.json() : null))
    .then(
      (j: { data?: Record<string, string> } | null) =>
        j?.data?.wideArt ?? j?.data?.largeArt ?? null,
    )
    .catch(() => null);

// --- tiers -----------------------------------------------------------------
// Pinned rather than fetched. The uuids and the token names match
// /v1/contenttiers exactly, and pinning them is what buys the zero requests on
// the screen that has to open fastest.

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

const tier = (name: TierName): Tier => ({
  name,
  icon: MEDIA + 'contenttiers/' + UUID[name] + '/displayicon.png',
});

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
