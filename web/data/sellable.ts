// Which things a store can offer you, and which are given rather than sold.
//
// A star says "tell me when this turns up in my store". For a battle pass
// reward that is a promise nothing can keep: it is not merchandise, it will
// never be in a panel, and the alert would simply never fire. So the star does
// not take the tap, and says why.
//
// HOW THIS IS KNOWN, because the last attempt at it failed and the failure is
// worth writing down. Asking "is this sold?" has no answer: the public
// catalogue gives a battle pass skin the same content tier, the same theme and
// the same asset path shape as a shop skin, and `/store/v1/offers/`, which was
// Riot's own answer, now 404s on every shard. Checked 2026-10-07, which is why
// the wishlist shipped without a filter and said so.
//
// The question has an answer from the other side. `/v1/contracts` is every
// battle pass, event pass and agent contract the game has, and each one
// enumerates its own rewards — 3,089 of them across 87 contracts. Anything in
// that set is given out by a contract. Anything a contract gives is not a
// thing a store sells.
//
// Measured before it was built, 2026-10-09:
//
//   skins       1,415 total, 519 from a contract
//   sprays        921 total, 675 from a contract
//   charms        898 total, 423
//   cards       1,016 total, 589
//   titles        444 total, 211
//
// And the check that made it trustworthy: of the 333 skin LINES in the game,
// 144 are entirely contract rewards and 189 are entirely not. Not one line is
// split down the middle. A signal that cut cleanly across every themed set in
// the game is describing something real about how Riot ships them, not a
// coincidence that mostly holds.
//
// THE SECOND SOURCE, added after the first one missed things people named:
// a Radiant buddy, a VCT winner buddy, a Game Changers title. None of those is
// a contract reward — they are competitive-act and esports rewards — so the
// contracts set let all of them through.
//
// The catalogue marks them itself. `isHiddenIfNotOwned` on a buddy, spray,
// card or title (and `hideIfNotOwned` on a charm level) is Riot saying this
// does not appear in the collection unless you have it, which is what they do
// to a thing that is awarded rather than offered. Measured 2026-10-09, over
// and above what contracts already caught: 256 charms, 189 titles, 80 cards,
// 39 sprays — 564 more. And ZERO skins, because the flag is not used on them
// at all, so it costs nothing on the screens where it would be noise.
//
// It arrives differently from the contracts set, and deliberately. The four
// indexes that carry the flag are already downloaded by every screen that
// shows one of these, so they register what they find as they build — see
// keepHidden() below. Fetching them again here would have put four megabytes
// of accessory catalogue behind the star on the store screen, which shows
// guns.
//
// WHAT IT STILL DOES NOT CLAIM. "Not a contract reward and not flagged" is
// not "will be in your store this week". Some of what is left rotates rarely,
// some only through the night market, and some is a promotional drop with
// nothing in the public data to tell it from a sold one — Brioche and Dolmir's
// Revenge both look exactly like a bundle charm, field for field. It rules out
// what can be ruled out, and the copy says only that.

const V1 = 'https://valorant-api.com/v1/';

interface Reward {
  uuid?: string;
  type?: string;
}
interface Level {
  reward?: Reward;
}
interface Chapter {
  levels?: Level[];
  freeRewards?: Reward[];
}
interface Raw {
  content?: { chapters?: Chapter[] };
}

/**
 * Ids the catalogue marks as awarded rather than offered.
 *
 * Filled by the index modules as they parse, rather than fetched here: they
 * are downloading the records anyway and the flag is on them. A screen that
 * has not loaded an index yet sees an empty set and the star works, which is
 * the same way the contracts half fails — open.
 */
const kept = new Set<string>();

/** Called by data/{buddies,sprays,cards,titles}.ts for each flagged record. */
export function keepHidden(...ids: Array<string | undefined>): void {
  for (const id of ids) if (id) kept.add(id);
}

let held: Promise<Set<string>> | null = null;

/**
 * Every uuid a contract hands out.
 *
 * Never rejects. An index that will not load comes back empty, and an empty
 * set means nothing is refused — the star works as it did before this file
 * existed, which is the right way for this to fail: it withholds a feature,
 * it does not withhold the app.
 */
export function given(): Promise<Set<string>> {
  held ??= fetch(V1 + 'contracts')
    .then((r) => (r.ok ? (r.json() as Promise<{ data?: Raw[] }>) : null))
    .then((j) => {
      const out = new Set<string>();
      for (const c of j?.data ?? []) {
        for (const ch of c.content?.chapters ?? []) {
          for (const lv of ch.levels ?? []) if (lv.reward?.uuid) out.add(lv.reward.uuid);
          for (const fr of ch.freeRewards ?? []) if (fr.uuid) out.add(fr.uuid);
        }
      }
      return out;
    })
    .catch(() => new Set<string>());
  return held;
}

/**
 * Whether a thing can turn up in a store at all.
 *
 * `ids` is everything the thing is known by: a spray or a card is one uuid, a
 * charm and a skin are their levels — a contract rewards the LEVEL, and the
 * wishlist stores the level too, so one of them matching is the answer.
 *
 * Unknown while the index is loading, and the caller treats unknown as yes:
 * a star that will not take a tap for the first second of a page is a worse
 * fault than one that takes a tap it should have refused.
 */
export const sold = (from: Set<string> | null, ...ids: Array<string | undefined>): boolean => {
  // The flag first: it needs no download of its own and it is the half that
  // answers for a rank reward, which no contract hands out.
  for (const id of ids) if (id && kept.has(id)) return false;
  return !from || !ids.some((id) => id && from.has(id));
};
