/** Shared contracts. Private credentials remain inside sealed Session values. */
export interface Jar {
  [name: string]: string;
}
export interface Tokens {
  access: string;
  id: string | null;
}

export interface Session {
  jar: Jar;
  puuid?: string;
  shard?: string;
  name?: string;
  wishlist?: Starred[];
  mail?: {
    to: string;
    lang?: 'es' | 'en';
    tz?: number;
    ok: boolean;
    /** Changes for every address/code generation; old callbacks cannot act on it. */
    gen?: string;
    send?: string;
    said?: string;
  };
}

export interface RiotHeaders extends Record<string, string> {
  Authorization: string;
  'X-Riot-Entitlements-JWT': string;
  'X-Riot-ClientPlatform': string;
  'X-Riot-ClientVersion': string;
}
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
export interface StoreView {
  offers: Offer[];
  remaining: number;
  night: {
    remaining: number;
    items: Array<Offer & { price: number | null; percent: number }>;
  } | null;
  bundles: Array<{
    id: string;
    base: number | null;
    price: number | null;
    remaining: number;
    items: GroupItem[];
    allOwned?: boolean;
  }>;
  accessory: {
    remaining: number;
    items: Array<{ id: string; type: string; cost: number | null; qty: number; owned?: boolean }>;
    allOwned?: boolean;
  } | null;
  wallet: { vp: number; rad: number; kc: number };
  account: {
    name: string;
    rank: { tier: number; rr: number } | null;
    card?: string | null;
    shard?: string;
    seen?: number;
  };
  fetchedAt: number;
}

/** Secrets must be declared here: .dev.vars is absent in CI. */
export interface Env extends Cloudflare.Env {
  JAR_KEY: string;
  RESEND_KEY: string;
  RESEND_HOOK: string;
}
export interface Starred {
  id: string;
  name: string;
  type?: string;
  tier?: string;
  levels?: number;
  chromas?: number;
  art?: string;
  at?: number;
}
export interface Hit extends Starred {
  cost?: number | null;
}
