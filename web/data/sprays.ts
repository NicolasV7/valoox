// The sprays index: every spray the game has.
//
// One fetch and the browser keeps it, the same trade as the weapons index and
// for the same reason — the tab opens on "18 of 921", and 921 is a number only
// the catalogue knows. The entitlements say which ids are yours; nothing in
// them says how many exist.
//
// Not catalogue.ts, which resolves one uuid at a time on purpose: that is the
// store's trade, where four items must not cost an index. This is the other
// side of it.

import { keepHidden } from './sellable.ts';

const V1 = 'https://valorant-api.com/v1/';

export interface Spray {
  id: string;
  name: string;
  /** The cut with no background behind it, which is what a spray is on a wall.
   *  displayIcon is the same picture for most of them and the fallback for the
   *  handful Riot never published a transparent one for. */
  art: string | null;
  /** The frames, for the ones that move in game. Most have none. */
  gif: string | null;
}

interface Raw {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
  fullTransparentIcon: string | null;
  animationGif: string | null;
  /** Riot's mark for a thing that is awarded rather than offered. See
   *  data/sellable.ts. */
  isHiddenIfNotOwned?: boolean;
}

// Riot ends all 921 displayNames in the word itself — "Reaver Spray" — and
// twelve of them carry a trailing space as well. On a screen whose heading
// already says Sprays that is the word twice, so it comes off here rather than
// in each place that draws one.
const KIND = / Spray$/;

/** Riot's name without that word. Exported because the screen that opens one
 *  resolves its uuid through catalogue.ts rather than through this index, and
 *  the two have to agree about what the thing is called. */
export const bare = (name: string): string => name.trim().replace(KIND, '');

let held: Promise<Spray[]> | null = null;

/** Every spray, in Riot's own order. Never rejects: an index that will not
 *  load leaves the tab empty rather than breaking the collection. */
export function sprays(): Promise<Spray[]> {
  held ??= fetch(V1 + 'sprays')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Raw[] } | null) =>
      (j?.data ?? []).map((s) => {
        if (s.isHiddenIfNotOwned) keepHidden(s.uuid);
        return {
          id: s.uuid,
          name: bare(s.displayName),
          art: s.fullTransparentIcon ?? s.displayIcon ?? null,
          gif: s.animationGif ?? null,
        };
      }),
    )
    .catch(() => []);
  return held;
}
