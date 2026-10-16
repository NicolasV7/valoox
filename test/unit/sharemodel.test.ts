import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { StoreView } from '../../web/data/types.ts';
import { identity, live, snapshot } from '../../web/share/model.ts';

const view = (): StoreView => ({
  account: { name: 'Player#VAL', rank: null, card: 'card' },
  offers: [{ id: 'skin', cost: 1775 }],
  wallet: { vp: 999, rad: 30, kc: 40 },
  fetchedAt: 1000,
  remaining: 60,
  night: null,
  accessory: null,
  bundles: [],
});

test('a share snapshot contains only the player, card, clock and daily offers', () => {
  const source = view();
  const picture = snapshot(source);
  assert.deepEqual(Object.keys(picture).sort(), ['card', 'fetchedAt', 'name', 'offers', 'until']);
  assert.equal(picture.until, 1060000);
  source.offers[0].cost = 0;
  assert.equal(picture.offers[0].cost, 1775);
});

test('only the daily clock controls expiry, even when a bundle expires first', () => {
  const source = view();
  source.bundles = [{ id: 'bundle', base: null, price: null, items: [], remaining: 1 }];
  const picture = snapshot(source);
  assert.equal(live(picture, 1002000), true);
  assert.equal(live(picture, 1060000), false);
  assert.equal(live({ ...picture, until: Number.NaN }, 1002000), false);
  assert.equal(live({ ...picture, offers: [] }, 1002000), false);
});

test('unknown prices remain unknown and a true free price stays zero', () => {
  const source = view();
  source.offers = [null, 0, Number.NaN, -1, 100].map((cost) => ({ id: 'skin', cost }));
  assert.deepEqual(
    snapshot(source).offers.map((o) => o.cost),
    [null, 0, null, null],
  );
});

test('hiding the tag removes it from the picture identity; names cannot inject bidi controls', () => {
  assert.deepEqual(identity('Player#VAL', false), ['Player', '']);
  assert.deepEqual(identity('Player#VAL', true), ['Player', '#VAL']);
  assert.deepEqual(identity('Player', false), ['Player', '']);
  const source = view();
  source.account.name = 'Player\u202e#VAL\n';
  assert.equal(snapshot(source).name, 'Player#VAL');
});
