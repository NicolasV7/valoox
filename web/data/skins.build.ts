// Shaping Riot's weapons payload into the index.
//
// Split from skins.ts because they are two jobs: that file says what a weapon,
// a skin, a level and a chroma are and answers questions about them; this one
// knows the field names valorant-api happens to use, which is the half that
// changes when Riot renames something.

import type { Family, Found, Rack, Weapon } from './skins.ts';

/** The order the game racks them in, which is the order the board draws. */
const ORDER = ['Sidearm', 'SMG', 'Shotgun', 'Rifle', 'Sniper', 'Heavy', 'Melee'];

export interface Index {
  racks: Rack[];
  byLevel: Map<string, Found>;
}

export interface Raw {
  uuid: string;
  defaultSkinUuid?: string;
  displayName: string;
  levelItem: string | null;
  streamedVideo: string | null;
  swatch: string | null;
  fullRender: string | null;
  displayIcon: string | null;
  contentTierUuid: string | null;
  category: string;
  shopData: { cost?: number } | null;
  levels: Raw[];
  chromas: Raw[];
  skins: Raw[];
}

// EEquippableSkinLevelItem::Finisher -> finisher, EEquippableCategory::SMG -> SMG
const TAIL = /::(\w+)$/;
// "Reaver Vandal Level 4\n(Variant 1 Red)" -> Red
const COLOUR = /\(Variant \d+\s+([^)]+)\)/;

const family = (skin: Raw): Family => ({
  levels: (skin.levels ?? []).map((l) => ({
    id: l.uuid,
    adds: TAIL.exec(l.levelItem ?? '')?.[1]?.toLowerCase() ?? null,
    video: l.streamedVideo ?? null,
    icon: l.displayIcon ?? null,
  })),
  chromas: (skin.chromas ?? []).map((c) => ({
    id: c.uuid,
    colour: COLOUR.exec(c.displayName ?? '')?.[1]?.trim() ?? null,
    swatch: c.swatch ?? null,
    render: c.fullRender ?? null,
    video: c.streamedVideo ?? null,
  })),
});

export function build(rows: Raw[]): Index {
  const byLevel = new Map<string, Found>();
  const byCategory = new Map<string, Weapon[]>();

  for (const w of rows) {
    const stock = (w.skins ?? []).find((s) => s.uuid === w.defaultSkinUuid);
    const skins = (w.skins ?? []).map((s) => ({
      id: s.uuid,
      name: s.displayName,
      tier: s.contentTierUuid ?? null,
      render: s.chromas?.[0]?.fullRender ?? s.levels?.[0]?.displayIcon ?? s.displayIcon ?? null,
      ...family(s),
    }));
    const weapon: Weapon = {
      id: w.uuid,
      name: w.displayName,
      icon: stock?.chromas?.[0]?.fullRender ?? w.displayIcon ?? null,
      cost: w.shopData?.cost ?? null,
      skins,
    };
    // Filled after the weapon exists, because what a level resolves to is both.
    for (const skin of skins)
      for (const level of skin.levels) byLevel.set(level.id, { weapon, skin });
    const of = TAIL.exec(w.category)?.[1] ?? 'Other';
    byCategory.set(of, [...(byCategory.get(of) ?? []), weapon]);
  }

  // "Grouped the way the buy menu groups them" — and the buy menu lists by
  // price, cheapest first. Riot's own shopData says so, which is why this is a
  // sort rather than a list of names that goes stale the day they ship a gun.
  // Ties break alphabetically: the Phantom, the Vandal and the Warden all cost
  // 2900 and that is the order the menu shows them in.
  const racks = ORDER.filter((of) => byCategory.has(of)).map((of) => ({
    of: of.toLowerCase(),
    weapons: (byCategory.get(of) as Weapon[]).sort(
      (a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name),
    ),
  }));
  return { racks, byLevel };
}
