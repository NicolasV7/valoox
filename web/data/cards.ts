// The player cards index: every card the game has.
//
// Riot ships each one three times — a square for a grid, a banner for the
// scoreboard, and the tall painting for a profile. They are crops, not scales,
// so the tall one has detail the square never shows. The tab draws the tall
// one cropped rather than the square scaled up, which is why it keeps both.

const V1 = 'https://valorant-api.com/v1/';

export interface Card {
  id: string;
  name: string;
  /** The tall painting, which is what a card is. */
  tall: string | null;
  /** The banner behind your name in the lobby. */
  wide: string | null;
  /** The square, beside it on the scoreboard. */
  small: string | null;
}

interface Raw {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
  wideArt: string | null;
  smallArt: string | null;
  largeArt: string | null;
}

// 1,009 of the 1,016 end in the word itself.
const KIND = / Card$/;

/** Riot's name without that word. */
export const bare = (name: string): string => name.trim().replace(KIND, '');

let held: Promise<Card[]> | null = null;

/** Every card, in Riot's own order. Never rejects. */
export function cards(): Promise<Card[]> {
  held ??= fetch(V1 + 'playercards')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Raw[] } | null) =>
      (j?.data ?? []).map((c) => ({
        id: c.uuid,
        name: bare(c.displayName),
        tall: c.largeArt ?? c.displayIcon ?? null,
        wide: c.wideArt ?? c.largeArt ?? null,
        small: c.smallArt ?? c.displayIcon ?? null,
      })),
    )
    .catch(() => []);
  return held;
}
