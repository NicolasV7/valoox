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

/** Both lists together, which is what the Worker counts and what the screen
 *  shows. Guns and accessories are not separate rooms with separate ceilings. */
export const MAX = 100;

export interface Star {
  id: string;
  name: string;
  /** Riot's item type uuid, so the list can draw a row without an index. */
  type?: string;
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
  full: boolean;
  toggle: (item: Star) => void;
} {
  const prefs = usePrefs();
  const stars = prefs?.wishlist ?? null;

  const toggle = useCallback((item: Star) => {
    const now = held()?.wishlist ?? [];
    const has = now.some((w) => w.id === item.id);
    if (!has && now.length >= MAX) return;
    void write(has ? now.filter((w) => w.id !== item.id) : [...now, item]);
  }, []);

  return {
    stars,
    on: (id: string) => !!stars?.some((w) => w.id === id),
    full: (stars?.length ?? 0) >= MAX,
    toggle,
  };
}
