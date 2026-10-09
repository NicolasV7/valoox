// The wishlist, as every screen with a star on it sees it.
//
// It rides in the same object as the channel — one row, one fetch — so this
// writes through the channel module's store rather than keeping a second copy
// that would disagree with it the moment either changed.
//
// Optimistic, and it has to be: the star is a tap on a phone and the round
// trip is a round trip. The mark moves now and the POST follows; if the POST
// loses, the answer that comes back is the truth and the mark goes with it.
// The whole list is sent every time because that is what the route takes —
// a hundred ids is two kilobytes, which is cheaper than the merge would be.

import { useCallback } from 'preact/hooks';
import * as api from './api.ts';
import { held, tell, usePrefs } from './channel.ts';
import type { Prefs } from './types.ts';

/** Riot's own item type for a skin level. A row saved before the app kept the
 *  type is a gun, because a gun is all it could star then. */
const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

/** Two ceilings, because they are two lists with two rotations behind them.
 *
 *  One number for both was the wrong shape: the daily panel shows four guns
 *  and the weekly accessory shop shows a handful, so a hundred accessories is
 *  a plausible list and a hundred guns is most of the ones worth having. They
 *  are also separately reachable — filling one should never be what stops you
 *  starring the other.
 *
 *  The ceiling itself is still about the row. The whole wishlist rides in one
 *  sealed blob and the daily job's work is a set intersection either way, so
 *  150 ids is about three kilobytes and nothing here is a compute budget. */
export const GUNS = 50;
export const BITS = 100;

/** The most that can be starred at all, for the one screen that counts both. */
export const BOTH = GUNS + BITS;

/** Which ceiling a thing falls under. */
export const capOf = (type?: string): number => ((type ?? LEVELS) === LEVELS ? GUNS : BITS);

/**
 * One starred thing, as this screen sees it.
 *
 * Everything past the id is here because the Worker has no catalogue: a uuid
 * alone cannot say what a thing is called, what tier it is, how many levels
 * it has or what colour it is, and the morning mail is drawn from exactly
 * these fields. Each screen sends what it happens to know — a tile knows the
 * colour it measured, a skin list knows the counts — and the mail leaves out
 * what it was not told.
 */
export interface Star {
  id: string;
  name: string;
  /** Riot's item type uuid, so the list can draw a row without an index. */
  type?: string;
  /** The content tier's own word, where the screen knows it. */
  tier?: string;
  levels?: number;
  chromas?: number;
  /** `r, g, b`, measured off the art. */
  art?: string;
}

const write = async (next: Star[]): Promise<void> => {
  const was = held();
  // Show it, then say it. A failure puts the old list back rather than leaving
  // a star that looks saved and is not.
  if (was) tell({ ...was, wishlist: next });
  const got = await api
    .post<Prefs>('/api/prefs', { wishlist: next, notify: { discord: was?.discord ?? '' } })
    .catch(() => null);
  if (got && typeof got === 'object' && 'wishlist' in got) tell(got as Prefs);
  else if (was) tell(was);
};

/**
 * The starred list, and one way to change it.
 *
 * `toggle` takes the name as well as the id because the name is what gets
 * stored: the daily job has no catalogue to look one up in, so the name you
 * saw when you starred it is the name the mail will carry.
 */
export function useStars(): {
  stars: Star[] | null;
  on: (id: string) => boolean;
  /** No room left for a thing of this kind. A function rather than a flag
   *  because the answer depends on what is being starred. */
  shut: (type?: string) => boolean;
  /** How many of that kind are starred, for the counters. */
  count: (type?: string) => number;
  toggle: (item: Star) => void;
} {
  const prefs = usePrefs();
  const stars = prefs?.wishlist ?? null;

  const toggle = useCallback((item: Star) => {
    const was = held();
    // Nothing yet is not an empty list. POST /api/prefs is a wholesale
    // replace, so a star tapped before the prefs GET lands — or after one that
    // failed, which channel.ts swallows into a permanent null — used to post a
    // one-item wishlist over the real one and an empty string over the
    // webhook. A hundred stars for one tap.
    if (!was) return;
    const now = was.wishlist ?? [];
    const has = now.some((w) => w.id === item.id);
    const cap = capOf(item.type);
    if (!has && now.filter((w) => capOf(w.type) === cap).length >= cap) return;
    void write(has ? now.filter((w) => w.id !== item.id) : [...now, item]);
  }, []);

  const count = (type?: string) => {
    const cap = capOf(type);
    return stars?.filter((w) => capOf(w.type) === cap).length ?? 0;
  };

  return {
    stars,
    on: (id: string) => !!stars?.some((w) => w.id === id),
    shut: (type?: string) => count(type) >= capOf(type),
    count,
    toggle,
  };
}
