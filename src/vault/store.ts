import type { StoreView } from '../types.ts';
import { KC, RAD, VP } from './constants.ts';

// Pure. Storefront JSON in, the shape the page renders out. No network, no clock
// except the one passed in — which is what makes the whole thing unit-testable.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = any;

export function shape(
  sf: Raw,
  wallet: Raw,
  now: number = Math.floor(Date.now() / 1000),
): StoreView {
  const panel = sf?.SkinsPanelLayout ?? {};

  // The rich array carries prices; the bare one is the fallback if Riot ever
  // drops it, so the page shows names rather than nothing.
  const rich = panel.SingleItemStoreOffers ?? [];
  const offers = rich.length
    ? rich.map((o: Raw) => ({
        id: o.Rewards?.[0]?.ItemID ?? o.OfferID,
        cost: o.Cost?.[VP] ?? null,
      }))
    : (panel.SingleItemOffers ?? []).map((id: string) => ({ id, cost: null }));

  const nm = sf?.BonusStore;
  const night = nm
    ? {
        remaining: nm.BonusStoreRemainingDurationInSeconds ?? 0,
        items: (nm.BonusStoreOffers ?? []).map((b: Raw) => ({
          id: b.Offer?.Rewards?.[0]?.ItemID,
          cost: b.Offer?.Cost?.[VP] ?? null,
          price: b.DiscountCosts?.[VP] ?? null,
          percent: b.DiscountPercent ?? 0,
        })),
      }
    : null;

  // Riot runs more than one bundle at a time; taking [0] silently hid the rest.
  const bundles = (sf?.FeaturedBundle?.Bundles ?? []).map((fb: Raw) => ({
    id: fb.DataAssetID,
    base: fb.TotalBaseCost?.[VP] ?? null,
    price: fb.TotalDiscountedCost?.[VP] ?? null,
    remaining:
      fb.DurationRemainingInSeconds ?? sf?.FeaturedBundle?.BundleRemainingDurationInSeconds ?? 0,
    items: (fb.Items ?? []).map((it: Raw) => ({
      id: it.Item?.ItemID,
      type: it.Item?.ItemTypeID,
      base: it.BasePrice ?? null,
      price: it.DiscountedPrice ?? null,
    })),
  }));

  // The accessory store prices in Kingdom Credits, not VP, and its rewards carry
  // a Quantity — buddies often come in twos.
  const ac = sf?.AccessoryStore;
  const accessory = ac
    ? {
        remaining: ac.AccessoryStoreRemainingDurationInSeconds ?? 0,
        items: (ac.AccessoryStoreOffers ?? []).map((o: Raw) => ({
          id: o.Offer?.Rewards?.[0]?.ItemID,
          type: o.Offer?.Rewards?.[0]?.ItemTypeID,
          cost: o.Offer?.Cost?.[KC] ?? null,
          qty: o.Offer?.Rewards?.[0]?.Quantity ?? 1,
        })),
      }
    : null;

  const b = wallet?.Balances ?? {};
  return {
    offers,
    remaining: panel.SingleItemOffersRemainingDurationInSeconds ?? 0,
    night,
    bundles,
    accessory,
    wallet: { vp: b[VP] ?? 0, rad: b[RAD] ?? 0, kc: b[KC] ?? 0 },
    fetchedAt: now,
  };
}

/** Everything in the view that can carry owned marks. Bundles and the accessory
 *  store only: the daily store never offers you something you already own. */
export function markable(
  view: StoreView,
): Array<{ items: Array<{ id: string; type: string; owned?: boolean }>; allOwned?: boolean }> {
  return [...view.bundles, ...(view.accessory ? [view.accessory] : [])];
}

/** Stamp owned flags from a set of entitlement ids. Entitlements and bundle items
 *  share ONE id space — both are level UUIDs, so owning Aeris Guardian lists its
 *  base plus Level 2 and 3 separately. Verified across skins, buddies, sprays and
 *  cards on 2026-09-14, which is why a plain Set lookup is correct here. */
export function markOwned(view: StoreView, owned: Set<string>): StoreView {
  for (const g of markable(view)) {
    for (const it of g.items) it.owned = owned.has(it.id);
    g.allOwned = g.items.length > 0 && g.items.every((it) => it.owned === true);
  }
  return view;
}
