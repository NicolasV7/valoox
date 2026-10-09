// What counts as a match, for every field in the app.
//
// Six screens had the same line — `name.toLowerCase().includes(query)` — and
// it is wrong in two ways people hit constantly.
//
// Word order. Riot calls it "Prime Classic", and the gun is a Classic, so
// "classic prime" is what a person types about half the time. A substring
// test says no to that, which reads as "you do not own one" rather than as
// "those words are the other way round".
//
// And spelling. "glitchpop" is one word in the catalogue and two to most
// people, "karambit" has a silent order to its vowels, and a phone keyboard
// adds its own. One wrong letter should not empty the screen.
//
// So: every word of the query has to appear somewhere in the name, in any
// order, and a long enough word may be off by an edit or two.
//
// HOW FAR OFF, by length, because a fixed allowance is wrong at both ends:
//
//   under 4   exact. At three letters one edit covers a third of the word and
//             "ion" starts matching "icon", "iron" and "lion" — the tolerance
//             would be wider than the word.
//   4 to 5    one edit.
//   6 and up  two. Measured on the complaint that produced this: "buddie" is
//             what people type for "buddy", and that is a deletion AND a
//             substitution. At one edit the search came back empty, which is
//             the worst answer a search can give to a word that is nearly
//             right. Two edits on six letters is the same third as one on
//             three, so the rule is the same rule.
//
// AND IT RANKS NOW, which it deliberately did not. The old note here said a
// list that reorders itself as you type is a list where the thing you were
// reaching for moves. That is true of a list whose ORDER changes under a
// stable set, and it is not what was happening: measured on this screen,
// "Yoru" returned 45 rows of which the first exact match was fourth, behind
// "Stay Safe, Wash Your Hands", "You Wanna Play?" and "Killjoy! I Choose
// You!" — because "Your" and "You" are each one edit from "Yoru". Eighteen of
// the twenty rows on screen did not contain the word typed. The set already
// changes completely on every keystroke; leaving it in catalogue order inside
// that churn was not stability, it was burying the answer.
//
// So the tolerance earns its place by sorting below the things that need no
// tolerance at all, and ties keep the catalogue's order.

/** Lower case, accents off, punctuation to spaces. Riot ships "Glitchpop",
 *  "Run It Back", "RGX 11z" and "Oni 2.0" — an apostrophe or a dot between
 *  two words should not be the thing that decides a match. */
export const fold = (said: string): string =>
  said
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** How many edits a word of this length is allowed to be wrong by. */
const slack = (n: number): number => (n < 4 ? 0 : n < 6 ? 1 : 2);

/**
 * Whether two words are within `max` edits.
 *
 * Four edits count and the fourth is the one that matters: insert, delete,
 * substitute, and SWAP TWO NEIGHBOURS. A swap is two substitutions to a plain
 * edit distance, so without it "raever" is as far from "reaver" as a different
 * word — and transposing two letters is the most common thing a pair of thumbs
 * does. Damerau's addition, and the reason he made it.
 *
 * Bounded rather than exact: the question is only ever "within max", so the
 * row is clipped to a band of 2*max+1 cells and the walk stops as soon as the
 * whole band is already over budget. At max 2 that is five cells per letter,
 * which is cheaper than it looks and runs over nine hundred names per
 * keystroke without being felt — see the measurement in Alerts.search.
 */
function within(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;
  if (max === 0) return false;

  let prev2: number[] = [];
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row: number[] = new Array(b.length + 1);
    row[0] = i;
    let best = i;
    const from = Math.max(1, i - max);
    const to = Math.min(b.length, i + max);
    for (let j = 1; j <= b.length; j++) {
      if (j < from || j > to) {
        row[j] = max + 1;
        continue;
      }
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(
        (prev[j] ?? max + 1) + 1,
        (row[j - 1] ?? max + 1) + 1,
        (prev[j - 1] ?? max + 1) + cost,
      );
      // the transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, (prev2[j - 2] ?? max + 1) + 1);
      }
      row[j] = v;
      if (v < best) best = v;
    }
    if (best > max) return false;
    prev2 = prev;
    prev = row;
  }
  return (prev[b.length] ?? max + 1) <= max;
}

/** The words of a folded string, for the near-match pass. */
const parts = (said: string): string[] => (said ? said.split(' ') : []);

/** Nothing matched. Anything above it is ordered by how little help it needed. */
export const MISS = 0;

/**
 * How well this haystack answers this query: 0 for no, higher for better.
 *
 * The haystack is folded by the caller once per item, because it does not
 * change between keystrokes and the query does.
 *
 *   3  the query is in there as typed, spaces or not
 *   2  every word of it is in there, in some order
 *   1  it got there on the typo allowance
 */
export function score(hay: string, query: string): number {
  const words = parts(query);
  if (!words.length) return 3;

  // Both squeezed flat first. Riot writes "Glitch Pop" and "Oni 2.0"; people
  // write glitchpop and oni20, and where the spaces fall is not something
  // anybody is being asked to remember.
  if (hay.includes(query) || hay.replace(/ /g, '').includes(query.replace(/ /g, ''))) return 3;

  let own: string[] | null = null;
  let clean = true;
  for (const word of words) {
    if (hay.includes(word)) continue;
    clean = false;
    const max = slack(word.length);
    if (!max) return MISS;
    own ??= parts(hay);
    if (!own.some((w) => within(w, word, max))) return MISS;
  }
  return clean ? 2 : 1;
}

/** The boolean, for callers that only need yes or no. */
export const hits = (hay: string, query: string): boolean => score(hay, query) > MISS;

/**
 * The whole thing, for a caller holding plain names: fold both, ask, and put
 * the ones that needed no help first.
 *
 * The sort is stable, so inside a tier the catalogue's own order survives.
 */
export const sift = <T>(list: T[], query: string, of: (x: T) => string): T[] => {
  const needle = fold(query);
  if (!needle) return list;
  const kept: Array<{ x: T; s: number }> = [];
  for (const x of list) {
    const s = score(fold(of(x)), needle);
    if (s > MISS) kept.push({ x, s });
  }
  kept.sort((a, b) => b.s - a.s);
  return kept.map((k) => k.x);
};
