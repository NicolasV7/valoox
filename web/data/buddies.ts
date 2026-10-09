// The buddies index: every charm the game has.
//
// Same trade as the sprays index and for the same reason — the tab opens on
// "34 of 898", and 898 is a number only the catalogue knows.
//
// Riot grants a charm by instance, and an instance is a charm *level* uuid:
// measured against the live account, all 34 entitlements matched a level and
// none matched a buddy, and those 34 are 18 distinct charms. So a charm is
// yours when any of its levels is, and the grid shows the charm while the
// heading counts the instances — which is why the heading is the larger
// number. The loadout agrees: `buddy` on a gun is its CharmLevelID.

import { keepHidden } from './sellable.ts';

const V1 = 'https://valorant-api.com/v1/';

export interface Buddy {
  id: string;
  name: string;
  art: string | null;
  /** Every level's uuid, which is what both the entitlements and the loadout
   *  speak in. */
  levels: string[];
}

interface Raw {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
  /** Riot's mark for a charm that is awarded rather than offered — a rank
   *  reward, a VCT winner charm. See data/sellable.ts. */
  isHiddenIfNotOwned?: boolean;
  levels: Array<{ uuid: string; displayIcon: string | null; hideIfNotOwned?: boolean }>;
}

// Riot ends every displayName in the word itself — "Glitchpop Buddy" — on a
// screen whose heading already says Buddies.
const KIND = / Buddy$/;

/** Riot's name without that word. */
export const bare = (name: string): string => name.trim().replace(KIND, '');

let held: Promise<Buddy[]> | null = null;

/**
 * The charm a level belongs to, by level uuid.
 *
 * Riot's per-level record is not always usable on its own. For HAZ + MATT the
 * level's displayIcon is a 119-byte 32x32 placeholder — it loads, so nothing
 * errors, and it draws as a black square. The charm's own icon is the real
 * 128x128 art. Measured across a sample: for an ordinary charm the two are the
 * same file, so preferring the charm costs nothing and fixes the ones where
 * they differ.
 *
 * The page cannot tell the two apart by looking: media.valorant-api.com is in
 * img-src and not connect-src, so script may display those bytes and may not
 * read them. The catalogue is the only thing that knows, and it does.
 */
export const byLevel = (): Promise<Map<string, Buddy>> =>
  buddies().then((all) => {
    const m = new Map<string, Buddy>();
    for (const b of all) for (const l of b.levels) m.set(l, b);
    return m;
  });

/** Every charm, in Riot's own order. Never rejects: an index that will not
 *  load leaves the tab empty rather than breaking the collection. */
export function buddies(): Promise<Buddy[]> {
  held ??= fetch(V1 + 'buddies')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Raw[] } | null) =>
      (j?.data ?? []).map((b) => {
        // Both ids, because the wishlist stores the level and the collection
        // shows the charm.
        if (b.isHiddenIfNotOwned || b.levels?.some((l) => l.hideIfNotOwned)) {
          keepHidden(b.uuid, ...(b.levels ?? []).map((l) => l.uuid));
        }
        return {
          id: b.uuid,
          name: bare(b.displayName),
          art: b.displayIcon ?? b.levels?.[0]?.displayIcon ?? null,
          levels: (b.levels ?? []).map((l) => l.uuid),
        };
      }),
    )
    .catch(() => []);
  return held;
}
