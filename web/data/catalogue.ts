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

import { byLevel } from './buddies.ts';
import { sizeOf } from './scale.ts';

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
  /** A player card ships in three crops and you meet it in three places — the
   *  tall one on your profile, the wide one behind your name in the lobby, the
   *  square one on the scoreboard. They are cropped, not scaled. */
  wide: string | null;
  small: string | null;
  /** The tall crop, which is the one a card is. displayIcon on a player card
   *  is the wide one, so the stage would letterbox it without this. */
  tall: string | null;
  /** A spray that moves in game. Riot publishes the frames for those and most
   *  sprays have none. */
  gif: string | null;
  /** A bundle's wide crop. Riot publishes three — 16:9, 3.33:1 and a 3:4
   *  portrait — and the strip on the store is 2.73:1, so the wide one is the
   *  one that was cut for it. Measured: it loses 18% of the picture to the
   *  crop where the 16:9 loses 35%. */
  banner: string | null;
}

// .../AK_Soulstealer_Lv1_PrimaryAsset
const LEVEL = /_Lv(\d)_/;

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
        // A title carries no art at all; a spray prefers the transparent cut,
        // and is the only thing in the catalogue that publishes one — so this
        // order is a spray rule everywhere and a no-op on the rest. Its
        // displayIcon is a square crop with a hard edge, which on a stage made
        // of weave reads as a sticker stuck over it.
        icon: d.fullTransparentIcon || d.displayIcon || d.largeArt || null,
        scale: sizeOf(d.assetPath),
        video: d.streamedVideo || null,
        level: Number(LEVEL.exec(d.assetPath ?? '')?.[1]) || null,
        wide: d.wideArt || null,
        small: d.smallArt || null,
        tall: d.largeArt || null,
        gif: d.animationGif || null,
        banner: d.displayIcon2 || null,
      };
    })
    .catch(() => null);

  seen.set(key, run);
  return run;
}

/** The daily store and the night market are always weapon skins. */
export const skin = (id: string) => one('weapons/skinlevels', id);

export const bundle = (id: string) => one('bundles', id);

/** One weapon's own name. For the buddies tab, which needs it only for the few
 *  guns something is hanging off — the index that has all of them is 430 KB. */
export const gun = (id: string) => one('weapons', id);

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

/** Riot's item type for a charm level. */
const CHARM = 'dd3bf334-87f3-40bd-b043-682a57a8dc3a';

/**
 * A charm, from the index rather than one request.
 *
 * The exception to this file's rule, and narrow on purpose. A charm level's
 * own record can carry a placeholder icon where its parent carries the art —
 * see byLevel() in data/buddies.ts — so the parent is the only correct
 * source. The index is 77 KB gzipped and fetched once per page, only when a
 * charm actually needs resolving; the rule this breaks is about the weapons
 * index, which is 3.5 MB and a different order of thing.
 *
 * Falls back to the single request if the index will not load, which is the
 * behaviour this had before.
 */
const charm = async (id: string): Promise<Piece | null> => {
  const b = (await byLevel()).get(id);
  if (!b?.art) return one('buddies/levels', id);
  return {
    name: b.name,
    icon: b.art,
    scale: 1,
    video: null,
    level: null,
    wide: null,
    small: null,
    tall: null,
    gif: null,
    banner: null,
  };
};

export const piece = (type: string, id: string): Promise<Piece | null> =>
  type === CHARM
    ? charm(id)
    : BY_TYPE[type]
      ? one(BY_TYPE[type] as string, id)
      : Promise.resolve(null);

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
