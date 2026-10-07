// Shared shapes. Kept deliberately small: everything here crosses a module
// boundary, and anything that does not should stay private to its module.

/** A Riot cookie jar as name -> value. Attributes are never kept. */
export interface Jar {
  [name: string]: string;
}

/** The pair that comes back in the reauth Location fragment. */
export interface Tokens {
  access: string;
  id: string | null;
}

/** What we hold for one signed-in user. All of it sealed: the ntfy topic is a
 *  capability to send this person messages, and the wishlist is taste. */
export interface Session {
  jar: Jar;
  puuid?: string;
  shard?: string;
  /** game_name#tag_line. userinfo already returns it at sign-in; this just stops
   *  us throwing it away and asking for it again. */
  name?: string;
  /** Skin LEVEL uuids with their display name, so the alert job never needs the
   *  3.5 MB catalogue — the browser resolves names once, at save time. */
  wishlist?: Array<{ id: string; name: string }>;
  /**
   * Where to send a hit. The user supplies only the identifying part — a topic or
   * an id/token pair — never a URL: the hosts are pinned in the egress allowlist,
   * so this field can never turn the notifier into an open proxy.
   *
   * MEASURED 2026-09-14: ntfy.sh rate-limits by source IP, and Cloudflare's egress
   * is shared and busy, so a Worker gets 429 consistently. Discord throttles per
   * webhook instead and is the reliable default from here.
   */
  notify?: { ntfy?: string; ntfyToken?: string; discord?: string };
}

/** Headers every authenticated Riot data call must carry. Extends Record so it
 *  can be handed straight to fetch() as a HeadersInit. */
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
  /** Who you are and where you rank. Not store data, but it shares the header
   *  with the wallet and the same cache lifetime. */
  account: { name: string; rank: { tier: number; rr: number } | null };
  fetchedAt: number;
}

/**
 * The bindings, from `wrangler types` plus the one secret — secrets do not live
 * in wrangler.toml, so they are not in the generated Env.
 */
export interface Env extends Cloudflare.Env {
  /** 32 random bytes, base64. Set with `wrangler secret put JAR_KEY`. */
  JAR_KEY: string;
}
