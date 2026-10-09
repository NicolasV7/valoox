// Everything a star is allowed to go on.
//
// One filter, and it removes a row that could only ever disappoint: anything
// already owned, because the daily store never offers you something you have.
//
// Not two: whether Riot SELLS a thing is answered elsewhere and answered the
// other way round — see data/sellable.ts — and it is not a filter. A contract
// reward stays in this list and stays browsable; what it loses is the star.
// Taking the row out would make the screen quietly disagree with the game's
// own collection, which is where people come from when they search here.
//
// The other was melee, kept out on the belief that the daily panel is four
// guns. It is not — a knife turns up in that panel like anything else, and
// the Night Market is the rotation that excludes them. So melee is in.

import { type Buddy, bare as bareBuddy } from './buddies.ts';
import { bare as bareCard, type Card } from './cards.ts';
import { fold, MISS, score } from './find.ts';
import type { Rack } from './skins.ts';
import { bare as bareSpray, type Spray } from './sprays.ts';
import { tierOf } from './tiers.ts';
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
  /** What the morning mail says under a name. Known here because this list is
   *  built from the index that has it; absent for an accessory, which has
   *  neither tier nor levels. */
  tier?: string;
  levels?: number;
  chromas?: number;
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

/** Every weapon, melee included, and only the base level: the store sells a
 *  skin, and level 2 is not a thing that turns up on its own. */
export function guns(racks: Rack[], owned: Set<string>): Findable[] {
  const out: Findable[] = [];
  for (const rack of racks) {
    for (const w of rack.weapons) {
      for (const skin of w.skins) {
        const id = skin.levels[0]?.id;
        // No tier is a default skin: the gun you already have, in grey.
        if (!id || !skin.tier || owned.has(id)) continue;
        out.push({
          ...row(id, skin.name, LEVELS, w.name, null),
          tier: tierOf(skin.tier)?.name,
          levels: skin.levels.length,
          chromas: skin.chromas.length,
        });
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
  if (!needle) return all;
  // Ranked, not just filtered. The typo allowance earns its place by sorting
  // below the names that needed none — otherwise "Yoru" leads with "Stay
  // Safe, Wash Your Hands", which is what it did. Sort is stable, so inside a
  // tier the catalogue's order survives.
  const kept: Array<{ f: Findable; s: number }> = [];
  for (const f of all) {
    const s = score(f.hay, needle);
    if (s > MISS) kept.push({ f, s });
  }
  kept.sort((a, b) => b.s - a.s);
  return kept.map((k) => k.f);
};
