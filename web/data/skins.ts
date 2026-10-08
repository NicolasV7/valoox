// The weapons index: what else a skin has.
//
// A skin LEVEL carries no reference to its parent, so the levels beside the
// one you opened and the chromas you could equip instead are only reachable
// from the index. It is 3.5 MB of JSON and 426 KB over the wire, measured
// 2026-10-08, and it arrives in under a second.
//
// That is why it is here and not in catalogue.ts: the store resolves one item
// at a time precisely so it never pays this, and the offer screen pays it once
// because it is the screen those two blocks are the point of. Fetched on the
// first open, held for the life of the page, and shared with the collection
// when it lands.

const V1 = 'https://valorant-api.com/v1/';

export interface Level {
  id: string;
  /** What this level adds, as a key for i18n. Null for the base level. */
  adds: string | null;
  video: string | null;
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

interface Raw {
  uuid: string;
  displayName: string;
  levelItem: string | null;
  streamedVideo: string | null;
  swatch: string | null;
  fullRender: string | null;
}

// EEquippableSkinLevelItem::Finisher -> finisher
const ADDS = /::(\w+)$/;
// "Reaver Vandal Level 4\n(Variant 1 Red)" -> Red
const COLOUR = /\(Variant \d+\s+([^)]+)\)/;

let held: Promise<Map<string, Family>> | null = null;

function build(rows: Array<{ levels: Raw[]; chromas: Raw[] }>): Map<string, Family> {
  const by = new Map<string, Family>();
  for (const skin of rows) {
    const family: Family = {
      levels: (skin.levels ?? []).map((l) => ({
        id: l.uuid,
        adds: ADDS.exec(l.levelItem ?? '')?.[1]?.toLowerCase() ?? null,
        video: l.streamedVideo ?? null,
      })),
      chromas: (skin.chromas ?? []).map((c) => ({
        id: c.uuid,
        colour: COLOUR.exec(c.displayName ?? '')?.[1]?.trim() ?? null,
        swatch: c.swatch ?? null,
        render: c.fullRender ?? null,
      })),
    };
    // Keyed by every level, because a level uuid is what the storefront sends.
    for (const level of family.levels) by.set(level.id, family);
  }
  return by;
}

/** Everything else this skin has, or null if it is not a weapon skin. */
export function familyOf(levelId: string): Promise<Family | null> {
  held ??= fetch(V1 + 'weapons/skins')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Array<{ levels: Raw[]; chromas: Raw[] }> } | null) => build(j?.data ?? []))
    .catch(() => new Map<string, Family>());
  return held.then((by) => by.get(levelId) ?? null);
}
