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
  /** Riot's own word for the region: 'na', 'eu', 'latam'. */
  shard?: string;
  /** Seconds: when this browser last made the Worker reach Riot. Not "when
   *  you last opened the app" — a cached read never touches Riot, so this is
   *  the age of the session rather than of the visit. */
  seen?: number;
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

/** What `/api/prefs` answers: the skins you starred and where an alert would
 *  go. Both are ours — they live in our own row and come back with the page —
 *  which is why neither waits on Riot or on the catalogue. A starred skin is
 *  an id and the name you saw when you starred it, and nothing else. */
export interface Prefs {
  /** `type` is Riot's item type uuid, so a row can draw itself without an
   *  index. Absent on anything starred before it was kept. */
  wishlist: Array<{ id: string; name: string; type?: string }>;
  discord: string;
  /** The address an alert would go to, whether it has carried a code back,
   *  and the last thing the provider said about the last message sent to it.
   *  `said` is theirs — `resend 422`, `email.bounced` — and is never printed:
   *  a fault code on a screen is something to look up, not something to read.
   *  Screens branch on it and say the outcome in their own words. */
  mail: { to: string; ok: boolean; said: string } | null;
  /** An outstanding code: when it dies, and how many tries are left on it.
   *  Never the digits. Null when there is none, or when the last one has
   *  expired. */
  code: { until: number; tries: number } | null;
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
