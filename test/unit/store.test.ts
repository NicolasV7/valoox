import assert from 'node:assert';
import { test } from 'vitest';
import { markOwned, shape } from '../../src/vault/store.ts';

const VP = '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741';
const RAD = 'e59aa87c-4cbf-517a-5983-6e81511be9b7';
const KC = '85ca954a-41f2-ce94-9b45-8ca3dd39a00d';
const SKIN = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
const SPRAY = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475';

const sf = {
  SkinsPanelLayout: {
    SingleItemOffers: ['aaa', 'bbb'],
    SingleItemStoreOffers: [
      { OfferID: 'aaa', Cost: { [VP]: 1775 }, Rewards: [{ ItemID: 'skin-a' }] },
      { OfferID: 'bbb', Cost: { [VP]: 875 }, Rewards: [{ ItemID: 'skin-b' }] },
    ],
    SingleItemOffersRemainingDurationInSeconds: 3600,
  },
  BonusStore: {
    BonusStoreRemainingDurationInSeconds: 7200,
    BonusStoreOffers: [
      {
        Offer: { Cost: { [VP]: 1775 }, Rewards: [{ ItemID: 'nm-a' }] },
        DiscountPercent: 47,
        DiscountCosts: { [VP]: 940 },
      },
    ],
  },
  AccessoryStore: {
    AccessoryStoreRemainingDurationInSeconds: 102945,
    AccessoryStoreOffers: [
      {
        Offer: {
          Cost: { [KC]: 5500 },
          Rewards: [{ ItemTypeID: SPRAY, ItemID: 'acc-a', Quantity: 2 }],
        },
      },
      { Offer: { Cost: { [KC]: 4000 }, Rewards: [{ ItemTypeID: SPRAY, ItemID: 'acc-b' }] } },
    ],
  },
  FeaturedBundle: {
    Bundles: [
      {
        DataAssetID: 'bundle-1',
        TotalBaseCost: { [VP]: 7100 },
        TotalDiscountedCost: { [VP]: 5325 },
        DurationRemainingInSeconds: 86400,
        Items: [
          { Item: { ItemTypeID: SKIN, ItemID: 'skin-x' }, BasePrice: 2675, DiscountedPrice: 2000 },
          { Item: { ItemTypeID: SPRAY, ItemID: 'spray-x' }, BasePrice: 325 },
        ],
      },
      {
        DataAssetID: 'bundle-2',
        TotalBaseCost: { [VP]: 5100 },
        TotalDiscountedCost: { [VP]: 3825 },
        DurationRemainingInSeconds: 43200,
      },
    ],
  },
};

test('daily offers come from Rewards[0].ItemID, not OfferID', () => {
  const out = shape(sf, { Balances: { [VP]: 4200, [RAD]: 40 } }, 1000);
  assert.deepEqual(out.offers, [
    { id: 'skin-a', cost: 1775 },
    { id: 'skin-b', cost: 875 },
  ]);
  assert.equal(out.remaining, 3600, 'drives both the countdown and the cache TTL');
  assert.equal(out.fetchedAt, 1000, 'the clock is injected, never read inside');
});

test('night market carries both prices and the discount', () => {
  const out = shape(sf, null, 0);
  assert.deepEqual(out.night?.items[0], { id: 'nm-a', cost: 1775, price: 940, percent: 47 });
});

test('every featured bundle survives, not just the first', () => {
  const out = shape(sf, null, 0);
  assert.equal(out.bundles.length, 2);
  assert.equal(out.bundles[0].price, 5325);
  assert.deepEqual(out.bundles[0].items, [
    { id: 'skin-x', type: SKIN, base: 2675, price: 2000 },
    { id: 'spray-x', type: SPRAY, base: 325, price: null },
  ]);
  assert.deepEqual(out.bundles[1].items, [], 'a bundle with no Items is empty, not broken');
});

test('the accessory store is priced in Kingdom Credits, not VP', () => {
  // Reading Cost[VP] here yields null for every item, with no error anywhere.
  const out = shape(sf, null, 0);
  assert.deepEqual(out.accessory?.items, [
    { id: 'acc-a', type: SPRAY, cost: 5500, qty: 2 },
    { id: 'acc-b', type: SPRAY, cost: 4000, qty: 1 },
  ]);
  assert.equal(out.accessory?.remaining, 102945);
});

test('wallet reads 0 for a missing currency, never undefined', () => {
  assert.deepEqual(shape(sf, { Balances: { [VP]: 4200, [RAD]: 40 } }, 0).wallet, {
    vp: 4200,
    rad: 40,
    kc: 0,
  });
});

test('an empty storefront is empty, not a crash', () => {
  const out = shape({}, null, 0);
  assert.equal(out.night, null, 'Night Market only exists while Riot runs one');
  assert.deepEqual(out.bundles, []);
  assert.equal(out.accessory, null);
  assert.deepEqual(out.offers, []);
  assert.deepEqual(out.wallet, { vp: 0, rad: 0, kc: 0 });
});

test('bare UUIDs are the fallback if Riot drops the rich offer array', () => {
  const out = shape({ SkinsPanelLayout: { SingleItemOffers: ['x', 'y'] } }, null, 0);
  assert.deepEqual(out.offers, [
    { id: 'x', cost: null },
    { id: 'y', cost: null },
  ]);
});

test('owned marks land on bundles and the accessory store', () => {
  // Entitlements and bundle items share ONE id space (both level UUIDs), which is
  // why a plain Set lookup is correct. Verified live across four item types.
  const out = markOwned(shape(sf, null, 0), new Set(['skin-x', 'spray-x', 'acc-a']));
  assert.equal(out.bundles[0].items[0].owned, true);
  assert.equal(out.bundles[0].allOwned, true, 'both items owned => the whole bundle is');
  assert.equal(out.accessory?.items[0].owned, true);
  assert.equal(out.accessory?.items[1].owned, false);
  assert.equal(out.accessory?.allOwned, false);
});

test('an empty group is never reported as fully owned', () => {
  const out = markOwned(shape(sf, null, 0), new Set());
  assert.equal(out.bundles[1].allOwned, false, 'bundle-2 has no items');
});
