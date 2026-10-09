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
// WHAT IT DOES NOT CLAIM. "Not from a contract" is not "will be in your store
// this week". Some of what is left rotates rarely, some only through the night
// market, and nothing here knows which. It rules out the items that cannot
// appear, which is the half that can be known, and the copy says only that.

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
export const sold = (from: Set<string> | null, ...ids: Array<string | undefined>): boolean =>
  !from || !ids.some((id) => id && from.has(id));
