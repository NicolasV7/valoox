// The catalogue indexes, as hooks.
//
// One download behind each — see data/skins.ts and data/sprays.ts — so a tab
// change or a weapon opening costs nothing after the first.

import { useEffect, useState } from 'preact/hooks';
import { type Rack, racks, type Weapon, weaponOf } from './skins.ts';
import { type Spray, sprays } from './sprays.ts';

function held<T>(get: () => Promise<T>, key: string): T | null {
  const [found, setFound] = useState<T | null>(null);

  useEffect(() => {
    let live = true;
    void get().then((v) => {
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

/** Every spray the game has, which is also where the total comes from. */
export const useSprays = (): Spray[] | null => held(sprays, 'sprays');
