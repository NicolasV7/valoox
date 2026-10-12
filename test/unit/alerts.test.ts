import assert from 'node:assert';
import { test } from 'vitest';
import type { StoreView } from '../../src/types.ts';
import { hits } from '../../src/vault/alerts.ts';

// The whole alert engine is this one pure function. It matches on skin LEVEL
// uuids because that is what the storefront returns — the browser resolved the
// names once, at save time, precisely so this job never touches the 3.5 MB
// catalogue it could not afford to parse.

const view = (offers: string[], night: string[] = []) =>
  ({
    offers: offers.map((id) => ({ id, cost: 1775 })),
    night: night.length
      ? { remaining: 1, items: night.map((id) => ({ id, cost: 1, price: 1, percent: 50 })) }
      : null,
  }) as unknown as StoreView;

const want = (...ids: string[]) => ids.map((id) => ({ id, name: 'Skin ' + id }));

test('a wanted skin in the daily store is a hit, with what it costs today', () => {
  // The price belongs to the panel rather than to the star, so it is picked
  // up here, where the two meet. The morning mail prints it.
  assert.deepEqual(hits(view(['a', 'b', 'c', 'd']), want('c')), [
    { id: 'c', name: 'Skin c', cost: 1775 },
  ]);
});

test('the night market counts too — that is where the discount is', () => {
  // And its price wins, because that is the number you would actually pay.
  assert.deepEqual(hits(view(['a'], ['z']), want('z')), [{ id: 'z', name: 'Skin z', cost: 1 }]);
});

test('nothing wanted, nothing sent', () => {
  assert.deepEqual(hits(view(['a', 'b']), want('x', 'y')), []);
  assert.deepEqual(hits(view(['a']), []), []);
});

test('accessory matches bind the id to its item type', () => {
  const store = {
    ...view([]),
    accessory: {
      remaining: 3600,
      items: [{ id: 'item', type: 'spray', cost: 5500, qty: 1 }],
    },
  } as StoreView;
  assert.deepEqual(hits(store, [{ id: 'item', type: 'spray', name: 'Wanted' }]), [
    { id: 'item', type: 'spray', name: 'Wanted', cost: 5500 },
  ]);
  assert.deepEqual(hits(store, [{ id: 'item', type: 'card', name: 'Other' }]), []);
});

test('several hits in one day come back together, not as several alerts', () => {
  assert.equal(hits(view(['a', 'b', 'c']), want('a', 'c')).length, 2);
});

test('an empty store is not a crash', () => {
  assert.deepEqual(hits(view([]), want('a')), []);
  assert.deepEqual(hits({ offers: [], night: null } as unknown as StoreView, want('a')), []);
});
