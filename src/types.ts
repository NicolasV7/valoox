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
  wishlist?: Array<{ id: string; name: string; type?: string }>;
  /**
   * Where to send a hit: a Discord webhook's `id/token`, never a URL. The host is
   * pinned in the egress allowlist, so this field cannot turn the notifier into
   * an open proxy no matter what is pasted into it.
   *
   * ntfy.sh lived here until 2026-10-07 and was removed, not for taste: it limits
   * publishing per source IP, a Worker has no IP of its own, and a free account
   * does not change that — its own API reports `"basis": "ip"` for a registered
   * user with no paid tier. Discord limits per webhook, which is a thing we have
   * one of each.
   */
  notify?: { discord?: string };
  /**
   * Where an alert goes, and whether that address has proved it can receive.
   *
   * Sealed with the rest for the same reason the webhook is: an address is a
   * capability to message this person. `ok` is the whole safety story — nothing
   * is ever sent to an address that has not carried a six-digit code back, so
   * this cannot become a button that mails strangers.
   *
   * `send` is the provider's id for the last message, which is how its webhook
   * finds its way back to this row, and `said` is the last thing the provider
   * said about it: its HTTP status at send time, then whatever the webhook
   * reports. Never our opinion of what happened.
   */
  mail?: {
    to: string;
    /** The language of the tab that set it, so every later message — the code
     *  again, the morning alert — arrives in the one it was asked for in. */
    lang?: 'es' | 'en';
    ok: boolean;
    send?: string;
    said?: string;
  };
  /** The last address this browser actually proved, which is not always the
   *  one in `mail`: changing it leaves the old one receiving until the new
   *  code comes back. It is what tells the claim which key to release. */
  mailWas?: string;
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
   *  with the wallet and the same cache lifetime. `card` is the uuid of the
   *  equipped player card; the browser turns it into artwork. */
  account: { name: string; rank: { tier: number; rr: number } | null; card?: string | null };
  fetchedAt: number;
}

/**
 * The bindings, from `wrangler types` plus the one secret — secrets do not live
 * in wrangler.toml, so they are not in the generated Env.
 */
export interface Env extends Cloudflare.Env {
  /** 32 random bytes, base64. Set with `wrangler secret put JAR_KEY`. */
  JAR_KEY: string;
  // RESEND_KEY, RESEND_HOOK and MAIL_FROM are not listed here on purpose.
  // `wrangler types` already has them — the two secrets from .dev.vars and
  // MAIL_FROM from [vars] — and declaring them again as optional contradicts
  // the generated required ones. The code still guards against a missing key,
  // because a type is a promise about the local file and not about production.
}

/** One wishlist entry that is in today's store. The name is the browser's,
 *  saved when it was starred: the Worker has no catalogue to look one up in. */
export interface Hit {
  id: string;
  name: string;
}
