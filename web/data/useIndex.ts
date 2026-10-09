// The catalogue indexes, as hooks.
//
// One download behind each — see data/skins.ts and data/sprays.ts — so a tab
// change or a weapon opening costs nothing after the first.

import { useEffect, useState } from 'preact/hooks';
import { type Buddy, buddies } from './buddies.ts';
import { type Card, cards } from './cards.ts';
import { given } from './sellable.ts';
import { type Found, type Rack, racks, skinOf, type Weapon, weaponOf } from './skins.ts';
import { type Spray, sprays } from './sprays.ts';
import { type Title, titles } from './titles.ts';

/** What each key has already resolved to. The promise behind it is cached too,
 *  but a promise is still a tick away — and that tick is a real defect on the
 *  way back: the screen paints its skeleton first, the document is short for
 *  one frame, and the browser clamps the scroll position it was about to
 *  restore. Coming back to a list you were two thousand pixels down should not
 *  put you at the top. */
const done = new Map<string, unknown>();

function held<T>(get: () => Promise<T>, key: string): T | null {
  const [found, setFound] = useState<T | null>(() => (done.get(key) as T) ?? null);

  useEffect(() => {
    if (done.has(key)) return;
    let live = true;
    void get().then((v) => {
      done.set(key, v);
      if (live) setFound(v);
    });
    return () => {
      live = false;
    };
    // `key` is the identity: the getter is a fresh closure every render.
  }, [key]);

  return found;
}

/** Every weapon, in the groups and the order the game racks them. */
export const useRacks = (): Rack[] | null => held(racks, 'racks');

/** One weapon and all of its skins. */
export const useWeapon = (id: string): Weapon | null => held(() => weaponOf(id), id);

/** The skin a level uuid belongs to, and the weapon that skin is for. */
export const useSkinOf = (levelId: string): Found | null => held(() => skinOf(levelId), levelId);

/** Every spray the game has, which is also where the total comes from. */
export const useSprays = (): Spray[] | null => held(sprays, 'sprays');

/** Every charm, likewise. */
export const useBuddies = (): Buddy[] | null => held(buddies, 'buddies');

/** Every player card. */
export const useCards = (): Card[] | null => held(cards, 'cards');

/** Every player title. */
export const useTitles = (): Title[] | null => held(titles, 'titles');

/** Every uuid handed out by a battle pass, an event pass or an agent
 *  contract — which is the set a store never sells. Null while it loads, and
 *  the caller reads null as "no reason to refuse". See data/sellable.ts. */
export const useGiven = (): Set<string> | null => held(given, 'given');
