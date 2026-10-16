import type { Offer, StoreView } from '../data/types.ts';

export type Format = 'portrait' | 'compact';

/** Only the fields the exported picture needs. Wallet and session data stay out. */
export interface Snapshot {
  name: string;
  card: string | null;
  fetchedAt: number;
  until: number;
  offers: Offer[];
}

export function snapshot(view: StoreView): Snapshot {
  return {
    name: clean(view.account.name),
    card: view.account.card ?? null,
    fetchedAt: view.fetchedAt,
    until: (view.fetchedAt + view.remaining) * 1000,
    offers: view.offers.slice(0, 4).map(({ id, cost }) => ({
      id,
      cost: cost !== null && Number.isFinite(cost) && cost >= 0 ? cost : null,
    })),
  };
}

export function live(source: Snapshot, now = Date.now()): boolean {
  return (
    Number.isFinite(source.fetchedAt) &&
    source.fetchedAt > 0 &&
    Number.isFinite(source.until) &&
    source.until > now &&
    source.offers.length > 0
  );
}

export const clean = (text: string): string =>
  Array.from(text.replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, ''))
    .slice(0, 160)
    .join('');

export function identity(name: string, showTag: boolean): [string, string] {
  const at = name.lastIndexOf('#');
  return at > 0 ? [name.slice(0, at), showTag ? name.slice(at) : ''] : [name, ''];
}
