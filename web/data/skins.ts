// The weapons index: every gun, every skin, every level and chroma.
//
// One request for all of it. /v1/weapons carries each weapon's whole skins
// array nested inside it, levels and chromas included — measured 2026-10-08,
// it is a strict superset of /v1/weapons/skins at the same 430 KB over the
// wire. So the offer screen and the collection pay for one index between them
// rather than one each.
//
// It is 3.5 MB of JSON uncompressed and it arrives in under a second. That is
// why it is here and not in catalogue.ts: the store resolves one item at a
// time precisely so it never pays this, and the screens that are about what
// else exists pay it once, because that is what they are for.

import { build, type Index, type Raw } from './skins.build.ts';

const V1 = 'https://valorant-api.com/v1/';

export interface Level {
  id: string;
  /** What this level adds, as a key for i18n. Null for the base level. */
  adds: string | null;
  video: string | null;
  /** The render of the gun at this level. 47 skins carry no icon of their own
   *  and every one of them has it here, so this is the reliable one. */
  icon: string | null;
}

export interface Chroma {
  id: string;
  /** Just the colour — "Red", not "Reaver Vandal Level 4\n(Variant 1 Red)". */
  colour: string | null;
  swatch: string | null;
  render: string | null;
  /** Some colourways ship a clip of their own. Measured: 865 of the 2,931
   *  chromas in the catalogue do, 186 melee and 679 gun — so which ones is a
   *  thing to read off the payload, not to guess from the weapon. */
  video: string | null;
}

export interface Family {
  levels: Level[];
  chromas: Chroma[];
}

export interface Skin extends Family {
  id: string;
  name: string;
  /** Riot's content tier uuid, or null for a battle-pass or default skin. */
  tier: string | null;
  /** The picture of the skin, and not `displayIcon`: measured across the 1,415
   *  in the catalogue, 47 have none at all and Riot publishes a 512x512 cross
   *  placeholder in place of some of the rest — 3 of the Guardian's 67. Every
   *  one of the 1,415 has a first chroma with a real full render, so that is
   *  the field, and the other two are only ever a fallback that is not used. */
  render: string | null;
}

export interface Weapon {
  id: string;
  name: string;
  /** The stock gun, at 512 across.
   *
   *  Not `displayIcon` on the weapon, which is between 168 and 512 wide — a
   *  Classic at 188 drawn into a 148px slot is upscaled on any 2× screen. And
   *  not the default skin's level icon either: Riot publishes a 512×512 ×
   *  placeholder for 18 of the 21, which I downloaded and looked at.
   *
   *  It is the default skin's chroma render. All 21 are real and all 21 are
   *  512 across — a Classic is 512×340 and a Marshal is 512×96, which is why
   *  one box with `contain` is the only way to size them together. */
  icon: string | null;
  /** What it costs in the buy menu, which is also the order the buy menu lists
   *  it in. Null for melee, which is not bought. */
  cost: number | null;
  skins: Skin[];
}

/** A level uuid is what both the storefront and the loadout speak in, and on
 *  its own it says nothing about what it is a level of. */
export interface Found {
  weapon: Weapon;
  skin: Skin;
}

export interface Rack {
  /** The category key, for i18n. Lower-cased from Riot's own enum. */
  of: string;
  weapons: Weapon[];
}

let held: Promise<Index> | null = null;

function index(): Promise<Index> {
  held ??= fetch(V1 + 'weapons')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Raw[] } | null) => build(j?.data ?? []))
    .catch(() => ({ racks: [], byLevel: new Map<string, Found>() }));
  return held;
}

/** Everything else this skin has, or null if it is not a weapon skin. */
export const familyOf = (levelId: string): Promise<Family | null> =>
  index().then((i) => i.byLevel.get(levelId)?.skin ?? null);

/** The skin a level belongs to, and the weapon that skin is for. */
export const skinOf = (levelId: string): Promise<Found | null> =>
  index().then((i) => i.byLevel.get(levelId) ?? null);

/** Every weapon, in the groups and the order the game racks them. */
export const racks = (): Promise<Rack[]> => index().then((i) => i.racks);

/** One weapon and all of its skins. */
export const weaponOf = (id: string): Promise<Weapon | null> =>
  index().then((i) => i.racks.flatMap((r) => r.weapons).find((w) => w.id === id) ?? null);

/** The skin line without the weapon on the end of it. "Reaver Vandal" in the
 *  Vandal's own slot is the word "Vandal" twice. */
export function shortName(skin: Skin, weapon: string): string {
  const cut = skin.name.lastIndexOf(' ' + weapon);
  return cut > 0 ? skin.name.slice(0, cut) : skin.name;
}
