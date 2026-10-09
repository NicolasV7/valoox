import assert from 'node:assert';
import { test } from 'vitest';
import { fold, hits, score, sift } from '../../web/data/find.ts';

// Six screens had `name.toLowerCase().includes(query)` and it said no to two
// things people type constantly: the words the other way round, and one
// wrong letter.

const yes = (hay: string, q: string) =>
  assert.equal(hits(fold(hay), fold(q)), true, hay + ' / ' + q);
const no = (hay: string, q: string) =>
  assert.equal(hits(fold(hay), fold(q)), false, hay + ' / ' + q);

test('the words in any order', () => {
  yes('Prime Classic', 'classic prime');
  yes('Prime Classic', 'prime classic');
  yes('Reaver Vandal', 'vandal reaver');
  yes('RGX 11z Pro Karambit', 'karambit rgx');
});

test('still a substring search when that is what was typed', () => {
  yes('Prime Classic', 'prim');
  yes('Prime Classic', 'ssic');
});

test('one wrong letter in a word of four or more', () => {
  yes('Prime Classic', 'clasic'); // a letter missing
  yes('Prime Classic', 'classsic'); // one too many
  yes('Reaver Vandal', 'vandel'); // one wrong
  yes('RGX 11z Pro Karambit', 'karambat');
});

test('two neighbours swapped, which is what thumbs actually do', () => {
  // A swap is two substitutions to a plain edit distance, so without
  // Damerau's rule raever is as far from Reaver as a different word.
  yes('Reaver Spray', 'raever');
  yes('Prime Classic', 'calssic');
  yes('RGX 11z Pro Karambit', 'karmabit');
});

test('and not in a short one, where one letter is a third of the word', () => {
  // At three letters the tolerance is wider than the word: ion would match
  // icon, iron and lion, and the screen would stop answering the question.
  no('Ion Vandal', 'icn');
  no('Ion Vandal', 'oni');
});

test('two wrong letters, once the word is long enough to carry them', () => {
  // The allowance is a share of the word, not a number: one edit on three
  // letters is a third, and so is two on six. This moved because of a real
  // complaint — "buddie" is what people type for "buddy", which is a deletion
  // AND a substitution, and at one edit the search came back empty.
  yes('Buddy', 'buddie');
  yes('Reaver Vandal', 'vendel');
  yes('Prime Classic', 'clessec');
});

test('but not on a word too short to carry them', () => {
  no('Ion Vandal', 'oni');
  no('Sage Spray', 'saeg'.replace('saeg', 'sgea')); // two edits on four letters
  no('Fade Spray', 'feda'.replace('feda', 'fdea')); // ditto
});

test('an exact match outranks one that needed the allowance', () => {
  // Measured on the alerts search: "Yoru" returned forty-five rows and the
  // first row containing the word was FOURTH, behind "Stay Safe, Wash Your
  // Hands", "You Wanna Play?" and "Killjoy! I Choose You!" — because "Your"
  // and "You" are each one edit from "Yoru".
  const all = ['Stay Safe, Wash Your Hands', 'You Wanna Play?', 'Sad Yoru', 'Yoru Figure'];
  const got = sift(all, 'yoru', (x) => x);
  assert.deepEqual(got.slice(0, 2), ['Sad Yoru', 'Yoru Figure']);
  assert.ok(score(fold('Sad Yoru'), 'yoru') > score(fold('You Wanna Play?'), 'yoru'));
});

test('every word present beats a word that had to be corrected', () => {
  assert.ok(
    score(fold('Reaver Vandal'), 'reaver vandal') > score(fold('Reaver Vandal'), 'reaver vandel'),
  );
});

test('where the spaces fall is not something anybody has to remember', () => {
  yes('Oni 2.0 Phantom', 'oni 20');
  yes('Oni 2.0 Phantom', 'oni2.0');
  yes('Glitch Pop Vandal', 'glitchpop');
  yes('Run It Back', 'runitback');
});

test('punctuation and accents are not the thing that decides a match', () => {
  yes('Run It Back', 'run it back');
  yes('Sentinels of Light', 'sentinels light');
  assert.equal(fold('  RGX 11z  Pro!  '), 'rgx 11z pro');
});

test('an empty query is every row', () => {
  assert.deepEqual(
    sift(['a', 'b'], '   ', (x) => x),
    ['a', 'b'],
  );
});

test('the catalogue order is kept, because a list that reorders itself moves', () => {
  const all = ['Prime Vandal', 'Reaver Vandal', 'Ion Vandal'];
  assert.deepEqual(
    sift(all, 'vandal', (x) => x),
    all,
  );
});
