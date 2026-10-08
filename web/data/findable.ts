// Everything a star is allowed to go on.
//
// Three filters, and each one removes a row that could only ever disappoint:
//
//   - not in what Riot sells. The content tier does not say this — most of the
//     battle pass carries one and is never in a shop — so it comes from
//     /store/v1/offers/, which is Riot's own answer. See data/sells.ts.
//   - already owned. The daily store never offers you something you have.
//   - melee. The daily panel is four guns and never a knife, so a starred
//     dagger is a row that cannot fire even when Riot does sell it.
//
// Built once per index load and held, because it is a walk over 1,400 skins
// and 2,900 accessories and the search field types faster than that.

import { type Buddy, bare as bareBuddy } from './buddies.ts';
import { bare as bareCard, type Card } from './cards.ts';
import type { Rack } from './skins.ts';
import { bare as bareSpray, type Spray } from './sprays.ts';
import type { Title } from './titles.ts';

export const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
export const BUDDIES = 'dd3bf334-87f3-40bd-b043-682a57a8dc3a';
export const SPRAYS = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475';
export const CARDS = '3f296c07-64c3-494c-923b-fe692a4fa1bd';
export const TITLES = 'de7caa6b-adf7-4588-bbd1-143831e786c6';

export interface Findable {
  id: string;
  name: string;
  type: string;
  /** The weapon it is for, or the kind of accessory. Shown under the name. */
  of: string;
  cost: number | null;
  /** Lower-cased name plus `of`, so one pass answers the field. */
  hay: string;
}

const row = (
  id: string,
  name: string,
  type: string,
  of: string,
  cost: number | null,
): Findable => ({
  id,
  name,
  type,
  of,
  cost,
  hay: (name + ' ' + of).toLowerCase(),
});

/** Guns only, and only the base level: the store sells a skin, and level 2 is
 *  not a thing that turns up on its own. */
export function guns(racks: Rack[], sold: Set<string>, owned: Set<string>): Findable[] {
  const out: Findable[] = [];
  for (const rack of racks) {
    if (rack.of === 'melee') continue;
    for (const w of rack.weapons) {
      for (const skin of w.skins) {
        const id = skin.levels[0]?.id;
        if (!id || !sold.has(id) || owned.has(id)) continue;
        out.push(row(id, skin.name, LEVELS, w.name, null));
      }
    }
  }
  return out;
}

export function bits(
  sprays: Spray[],
  buddies: Buddy[],
  cards: Card[],
  titles: Title[],
  sold: Set<string>,
  owned: Set<string>,
  words: { spray: string; buddy: string; card: string; title: string },
): Findable[] {
  const out: Findable[] = [];
  const take = (id: string, name: string, type: string, of: string) => {
    if (sold.has(id) && !owned.has(id)) out.push(row(id, name, type, of, null));
  };
  for (const s of sprays) take(s.id, bareSpray(s.name), SPRAYS, words.spray);
  // A charm is sold as its first level, which is also what the loadout speaks.
  for (const b of buddies) take(b.levels[0] ?? b.id, bareBuddy(b.name), BUDDIES, words.buddy);
  for (const c of cards) take(c.id, bareCard(c.name), CARDS, words.card);
  for (const t of titles) take(t.id, t.name, TITLES, words.title);
  return out;
}

/** Narrowed by the field. Empty query means everything, which the caller caps. */
export const narrow = (all: Findable[], q: string): Findable[] => {
  const needle = q.trim().toLowerCase();
  return needle ? all.filter((f) => f.hay.includes(needle)) : all;
};
