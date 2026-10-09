// Everything a star is allowed to go on.
//
// Two filters, and each one removes a row that could only ever disappoint:
//
//   - already owned. The daily store never offers you something you have.
//   - melee. The daily panel is four guns and never a knife, so a starred
//     dagger is a row that cannot fire whatever else is true of it.
//
// There was a third and it is gone, which is worth writing down because it
// looks like an omission. Whether Riot sells a given skin at all is not in
// the public catalogue — a battle-pass skin carries a content tier and a
// theme exactly like a sold one — and Riot's own answer, /store/v1/offers/,
// now 404s on every shard and every spelling of the path. So the list holds
// things that will never match, and the screen says so rather than pretending
// to a filter it cannot run.

import { type Buddy, bare as bareBuddy } from './buddies.ts';
import { bare as bareCard, type Card } from './cards.ts';
import { fold, hits } from './find.ts';
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
  /** Folded name plus `of`, so one pass answers the field. See data/find.ts. */
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
  hay: fold(name + ' ' + of),
});

/** Guns only, and only the base level: the store sells a skin, and level 2 is
 *  not a thing that turns up on its own. */
export function guns(racks: Rack[], owned: Set<string>): Findable[] {
  const out: Findable[] = [];
  for (const rack of racks) {
    if (rack.of === 'melee') continue;
    for (const w of rack.weapons) {
      for (const skin of w.skins) {
        const id = skin.levels[0]?.id;
        // No tier is a default skin: the gun you already have, in grey.
        if (!id || !skin.tier || owned.has(id)) continue;
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
  owned: Set<string>,
  words: { spray: string; buddy: string; card: string; title: string },
): Findable[] {
  const out: Findable[] = [];
  const take = (id: string, name: string, type: string, of: string) => {
    if (!owned.has(id)) out.push(row(id, name, type, of, null));
  };
  for (const s of sprays) take(s.id, bareSpray(s.name), SPRAYS, words.spray);
  // A charm is sold as its first level, which is also what the loadout speaks.
  for (const b of buddies) take(b.levels[0] ?? b.id, bareBuddy(b.name), BUDDIES, words.buddy);
  for (const c of cards) take(c.id, bareCard(c.name), CARDS, words.card);
  for (const t of titles) take(t.id, t.name, TITLES, words.title);
  return out;
}

/** Narrowed by the field. Empty query means everything, which the caller
 *  caps. `hay` is folded once at build time — see row() — because it does not
 *  change between keystrokes and the query does. */
export const narrow = (all: Findable[], q: string): Findable[] => {
  const needle = fold(q);
  return needle ? all.filter((f) => hits(f.hay, needle)) : all;
};
