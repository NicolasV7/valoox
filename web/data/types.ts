// The wire. These are the shapes the Worker sends, written out on this side of
// it rather than imported from src/: the two halves compile against different
// libraries — the Worker has no DOM and this has no Cloudflare bindings — and a
// boundary that is written down is one you notice yourself changing.
//
// Names and artwork are not in here on purpose. Riot answers in ids, and the
// browser resolves them against the catalogue. The Worker never parses it.

/** One of the four daily offers. `cost` is null only if Riot omits it. */
export interface Offer {
  id: string;
  cost: number | null;
}

export interface GroupItem {
  id: string;
  type: string;
  base: number | null;
  price: number | null;
  owned?: boolean;
}

export interface Bundle {
  id: string;
  base: number | null;
  price: number | null;
  /** Seconds. Riot's own countdown, not one we compute. */
  remaining: number;
  items: GroupItem[];
  allOwned?: boolean;
}

export interface AccessoryStore {
  remaining: number;
  items: Array<{ id: string; type: string; cost: number | null; qty: number; owned?: boolean }>;
  allOwned?: boolean;
}

export interface NightMarket {
  remaining: number;
  items: Array<Offer & { price: number | null; percent: number }>;
}

export interface Wallet {
  vp: number;
  rad: number;
  kc: number;
}

/** Who you are and where you rank. Not store data, but it shares the header and
 *  the same cache lifetime. `card` is the uuid of the equipped player card. */
export interface Account {
  name: string;
  rank: { tier: number; rr: number } | null;
  card?: string | null;
}

export interface StoreView {
  offers: Offer[];
  remaining: number;
  night: NightMarket | null;
  bundles: Bundle[];
  accessory: AccessoryStore | null;
  wallet: Wallet;
  account: Account;
  fetchedAt: number;
}

/** What `/api/qr` answers. `url` only on start; `shard` only once approved. */
export interface Scan {
  url?: string;
  status?: 'waiting' | 'expired' | 'ok';
  shard?: string;
}

/** The three things that can go wrong, which is all a person needs to be told
 *  apart. The server's own message is for the log and never reaches a screen. */
export type Fault = 'expired' | 'riot' | 'us';

/** What you have, and what you have on.
 *
 *  `byType` is keyed by Riot's item type uuid and the values are every id owned
 *  of that type — owning one skin lists its base plus each level and chroma
 *  separately, so these are larger than they look. */
export interface Inventory {
  byType: Record<string, string[]>;
  worn: {
    guns: Record<string, { level: string; chroma: string | null; buddy: string | null }>;
    sprays: string[];
    card: string | null;
    title: string | null;
  } | null;
  fetchedAt: number;
}
