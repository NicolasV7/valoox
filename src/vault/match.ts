import type { Hit, Starred, StoreView } from '../types.ts';

/** Accessory ids need their item type; skin ids are level ids. */
export function hits(view: StoreView, wishlist: Starred[]): Hit[] {
  const offered = new Map<string, number | null>();
  for (const o of view.offers) offered.set(o.id, o.cost);
  for (const n of view.night?.items ?? []) if (n.id) offered.set(n.id, n.price ?? n.cost);
  for (const a of view.accessory?.items ?? []) offered.set(a.type + ':' + a.id, a.cost);
  return wishlist.flatMap((w) => {
    const key = w.type && offered.has(w.type + ':' + w.id) ? w.type + ':' + w.id : w.id;
    return offered.has(key) ? [{ ...w, cost: offered.get(key) }] : [];
  });
}
