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
  icon: string | null;
}

export interface Weapon {
  id: string;
  name: string;
  /** The stock gun. Riot publishes a 512×512 × placeholder as the displayIcon
   *  of most standard skin levels — downloaded one and looked at it — so this
   *  is the only real picture of a weapon with nothing on it. */
  icon: string | null;
  /** What it costs in the buy menu, which is also the order the buy menu lists
   *  it in. Null for melee, which is not bought. */
  cost: number | null;
  skins: Skin[];
}

/** The order the game racks them in, which is the order the board draws. */
const ORDER = ['Sidearm', 'SMG', 'Shotgun', 'Rifle', 'Sniper', 'Heavy', 'Melee'];

export interface Rack {
  /** The category key, for i18n. Lower-cased from Riot's own enum. */
  of: string;
  weapons: Weapon[];
}

interface Raw {
  uuid: string;
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
  })),
});

interface Index {
  racks: Rack[];
  /** Keyed by every level, because a level uuid is what the storefront sends. */
  byLevel: Map<string, Family>;
}

function build(rows: Raw[]): Index {
  const byLevel = new Map<string, Family>();
  const byCategory = new Map<string, Weapon[]>();

  for (const w of rows) {
    const weapon: Weapon = {
      id: w.uuid,
      name: w.displayName,
      icon: w.displayIcon ?? null,
      cost: w.shopData?.cost ?? null,
      skins: (w.skins ?? []).map((s) => {
        const f = family(s);
        for (const level of f.levels) byLevel.set(level.id, f);
        return {
          id: s.uuid,
          name: s.displayName,
          tier: s.contentTierUuid ?? null,
          icon: s.displayIcon ?? null,
          ...f,
        };
      }),
    };
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

let held: Promise<Index> | null = null;

function index(): Promise<Index> {
  held ??= fetch(V1 + 'weapons')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Raw[] } | null) => build(j?.data ?? []))
    .catch(() => ({ racks: [], byLevel: new Map<string, Family>() }));
  return held;
}

/** Everything else this skin has, or null if it is not a weapon skin. */
export const familyOf = (levelId: string): Promise<Family | null> =>
  index().then((i) => i.byLevel.get(levelId) ?? null);

/** Every weapon, in the groups and the order the game racks them. */
export const racks = (): Promise<Rack[]> => index().then((i) => i.racks);

/** One weapon and all of its skins. */
export const weaponOf = (id: string): Promise<Weapon | null> =>
  index().then((i) => i.racks.flatMap((r) => r.weapons).find((w) => w.id === id) ?? null);
