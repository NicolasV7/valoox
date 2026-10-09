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
// order, and a word of four letters or more may be off by one edit. Four,
// because at three the distance covers a third of the word and "ion" starts
// matching "icon", "iron" and "lion" — at that length the typo tolerance is
// wider than the word.
//
// Nothing here is a fuzzy ranking. The result stays in the catalogue's own
// order, because a list that reorders itself as you type is a list where the
// thing you were reaching for moves.

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

/** Whether two words are one typo apart.
 *
 *  Four edits count and the fourth is the one that matters: insert, delete,
 *  substitute, and SWAP TWO NEIGHBOURS. A swap is two substitutions to a
 *  plain edit distance, so without it "raever" is as far from "reaver" as a
 *  different word — and transposing two letters is the most common thing a
 *  pair of thumbs does. Damerau's addition, and the reason he made it.
 *
 *  Not a matrix: the answer is only ever yes or no at a distance of one,
 *  which a single walk settles. The lengths differ by at most one or the
 *  answer is already no, and after the first mismatch the tails have to
 *  agree exactly. */
function oneOff(a: string, b: string): boolean {
  if (a === b) return true;
  const [s, t] = a.length <= b.length ? [a, b] : [b, a];
  if (t.length - s.length > 1) return false;

  let i = 0;
  while (i < s.length && s[i] === t[i]) i++;
  if (i === s.length) return true; // one extra letter on the end of t

  if (s.length !== t.length) {
    // One insertion in t: skip it and the tails must agree.
    return s.slice(i) === t.slice(i + 1);
  }
  // One substitution, or the two at the mismatch are each other's.
  if (s.slice(i + 1) === t.slice(i + 1)) return true;
  return s[i] === t[i + 1] && s[i + 1] === t[i] && s.slice(i + 2) === t.slice(i + 2);
}

/** The words of a folded string, for the near-match pass. */
const parts = (said: string): string[] => (said ? said.split(' ') : []);

/**
 * Whether this haystack answers this query.
 *
 * The haystack is folded by the caller once per item, because it does not
 * change between keystrokes and the query does.
 */
export function hits(hay: string, query: string): boolean {
  const words = parts(query);
  if (!words.length) return true;

  // Both squeezed flat first. Riot writes "Glitch Pop" and "Oni 2.0"; people
  // write glitchpop and oni20, and where the spaces fall is not something
  // anybody is being asked to remember.
  if (hay.replace(/ /g, '').includes(query.replace(/ /g, ''))) return true;

  let own: string[] | null = null;
  for (const word of words) {
    if (hay.includes(word)) continue;
    // Only now is it worth splitting the haystack.
    if (word.length < 4) return false;
    own ??= parts(hay);
    if (!own.some((w) => oneOff(w, word))) return false;
  }
  return true;
}

/** The whole thing, for a caller holding plain names: fold both and ask. */
export const sift = <T>(list: T[], query: string, of: (x: T) => string): T[] => {
  const needle = fold(query);
  if (!needle) return list;
  return list.filter((x) => hits(fold(of(x)), needle));
};
