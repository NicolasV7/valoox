import assert from 'node:assert';
import { test } from 'vitest';
import type { StoreView } from '../../src/types.ts';
import { hits, message } from '../../src/vault/alerts.ts';

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

test('a wanted skin in the daily store is a hit', () => {
  assert.deepEqual(hits(view(['a', 'b', 'c', 'd']), want('c')), [{ id: 'c', name: 'Skin c' }]);
});

test('the night market counts too — that is where the discount is', () => {
  assert.deepEqual(hits(view(['a'], ['z']), want('z')), [{ id: 'z', name: 'Skin z' }]);
});

test('nothing wanted, nothing sent', () => {
  assert.deepEqual(hits(view(['a', 'b']), want('x', 'y')), []);
  assert.deepEqual(hits(view(['a']), []), []);
});

test('several hits in one day come back together, not as several alerts', () => {
  assert.equal(hits(view(['a', 'b', 'c']), want('a', 'c')).length, 2);
});

test('an empty store is not a crash', () => {
  assert.deepEqual(hits(view([]), want('a')), []);
  assert.deepEqual(hits({ offers: [], night: null } as unknown as StoreView, want('a')), []);
});

test('the message reads like a sentence in both shapes', () => {
  assert.equal(
    message([{ id: 'x', name: 'Reaver Vandal' }]),
    'Reaver Vandal está en tu tienda hoy.',
  );
  assert.equal(
    message([
      { id: 'x', name: 'Reaver Vandal' },
      { id: 'y', name: 'Prime Phantom' },
    ]),
    'Reaver Vandal, Prime Phantom están en tu tienda hoy.',
  );
});

test('the message carries no identifier, only names the user chose', () => {
  const m = message([{ id: 'e7c63390-eda7-46e0-bb7a-a6abdacd2433', name: 'Sakura Sheriff' }]);
  assert.ok(!m.includes('e7c63390'), 'a uuid in a push would leak through ntfy');
});
