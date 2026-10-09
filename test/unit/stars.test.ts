import assert from 'node:assert';
import { test } from 'vitest';
import { cleanWishlist } from '../../src/routes/wishlist.ts';
import { sold } from '../../web/data/sellable.ts';

// Two things that are easy to get wrong and expensive when they are.
//
// The ceiling is enforced in two places, which it has to be: the browser so
// the star stops taking taps, and the Worker because the browser is not a
// place to enforce anything. Only the Worker's half is a security property,
// and it is the half tested here.

const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
const SPRAY = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475';
const CARD = '3f296c07-64c3-494c-923b-fe692a4fa1bd';

/** n rows of one kind, with ids that differ. */
const many = (n: number, type: string | undefined, from = 0) =>
  Array.from({ length: n }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(from + i).padStart(12, '0')}`,
    name: 'thing ' + (from + i),
    type,
  }));

const count = (list: Array<{ type?: string }>, type: string) =>
  list.filter((w) => (w.type ?? LEVELS) === type).length;

test('fifty guns and a hundred accessories, each counted on its own', () => {
  const kept = cleanWishlist({ wishlist: [...many(60, LEVELS), ...many(110, SPRAY, 60)] }, []);
  assert.equal(count(kept, LEVELS), 50);
  assert.equal(count(kept, SPRAY), 100);
});

test('a full gun list does not spend the accessory room', () => {
  // The old single slice did exactly this: a hundred guns at the front and the
  // accessories behind them never got in at all.
  const kept = cleanWishlist({ wishlist: [...many(80, LEVELS), ...many(20, CARD, 80)] }, []);
  assert.equal(count(kept, LEVELS), 50);
  assert.equal(count(kept, CARD), 20);
});

test('a row with no usable type counts as a gun, the way the browser reads it', () => {
  // Otherwise the cap is walked around by leaving the field off: the Worker
  // would file sixty untyped rows under accessories and the screen would then
  // draw them all as guns.
  const kept = cleanWishlist(
    { wishlist: [...many(60, undefined), ...many(60, 'not-a-uuid', 60)] },
    [],
  );
  assert.equal(kept.length, 50);
});

test('a thing a contract hands out is not a thing a store sells', () => {
  const given = new Set([SPRAY, LEVELS]);
  assert.equal(sold(given, SPRAY), false);
  assert.equal(sold(given, CARD), true);
  // A charm and a skin are known by their level as well as by themselves, and
  // either one matching is the answer.
  assert.equal(sold(given, CARD, LEVELS), false);
});

test('an index that would not load refuses nothing', () => {
  // sellable.ts fails open on purpose: an empty set, or none at all, means the
  // star works exactly as it did before any of this existed. Withholding a
  // feature is the acceptable failure; withholding the app is not.
  assert.equal(sold(null, SPRAY), true);
  assert.equal(sold(new Set(), SPRAY), true);
});
