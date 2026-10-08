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

export interface Piece {
  name: string | null;
  icon: string | null;
  /** How long the thing really is, relative to the longest weapon. 1 for
   *  anything that is not a weapon. See sizeOf(). */
  scale: number;
  /** Riot's own clip of this level, on their CDN. Null for anything that has
   *  none, which is most of the catalogue outside weapon skins. */
  video: string | null;
  /** Which level of its skin this is, 1-5. From the asset path, because the
   *  payload does not carry the number and the parent skin is a 3.5 MB index
   *  away. Null when the path does not say. */
  level: number | null;
}

// .../AK_Soulstealer_Lv1_PrimaryAsset
const LEVEL = /_Lv(\d)_/;

/**
 * How long a weapon really is, relative to the longest one.
 *
 * Riot draws every render at the same file width — measured: every skin level
 * icon is 512px across, whatever it is of — so a Ghost arrives the same length
 * as an Operator, and a column of four offers reads as an oversized pistol next
 * to a correctly sized rifle. The game does not look like that.
 *
 * The asset path says which family the skin came from, and seven of them cover
 * the whole catalogue: Sidearms, Rifles, SniperRifles, SubMachineGuns,
 * Shotguns, HvyMachineGuns, Melee. That is enough to give each one its size
 * back, with no index to download and no name to parse.
 *
 * Compressed, not literal. A Ghost really is about half a Vandal, and at half
 * it sat in the middle of a 350px row with nothing around it — the row read as
 * empty rather than as a small gun. The floor is 0.66, which is where the
 * artboard put its own smallest render, so the order is the game's and the
 * weight on the page is the design's.
 */
const SIZE: Record<string, number> = {
  SniperRifles: 1,
  HvyMachineGuns: 0.98,
  Rifles: 0.95,
  Shotguns: 0.85,
  SubMachineGuns: 0.82,
  Melee: 0.7,
  Sidearms: 0.66,
};

// .../Equippables/Guns/Rifles/AK/... and .../Equippables/Melee/Cyberpunk/...
const FAMILY = /\/Equippables\/(?:Guns\/)?([^/]+)\//;

export function sizeOf(assetPath: string | undefined): number {
  const found = assetPath ? FAMILY.exec(assetPath) : null;
  return (found && SIZE[found[1] as string]) || 1;
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
        scale: sizeOf(d.assetPath),
        video: d.streamedVideo || null,
        level: Number(LEVEL.exec(d.assetPath ?? '')?.[1]) || null,
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
