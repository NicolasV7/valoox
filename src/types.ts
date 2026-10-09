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
  wishlist?: Starred[];
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
    /** And its clock, as minutes behind UTC. The Worker runs in UTC and the
     *  reader does not, so without this no message can print a time. */
    tz?: number;
    ok: boolean;
    send?: string;
    said?: string;
  };
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
  account: {
    name: string;
    rank: { tier: number; rr: number } | null;
    card?: string | null;
    /** Riot's own word for the region this account plays in — 'na', 'eu',
     *  'latam'. The affinity rather than the host it routes to, because that
     *  is the one a player would recognise. */
    shard?: string;
    /** Seconds: when this browser last made the Worker reach Riot. */
    seen?: number;
  };
  fetchedAt: number;
}

/**
 * The bindings: what `wrangler types` generates from wrangler.toml, plus every
 * secret, because a secret is not in wrangler.toml and so is not generated.
 *
 * All three are declared here rather than left to the generator. On this
 * machine `wrangler types` reads `.dev.vars` and emits them anyway, which is
 * exactly why they were once left out — and `.dev.vars` is gitignored, so CI
 * generated an Env without them and `tsc` failed on a file nobody had touched.
 * The secrets a Worker needs are a contract, and a contract cannot live in a
 * file that only exists on one laptop.
 *
 * Redeclaring them is safe: the generated ones are `string` too, so where both
 * exist the types are identical. The code still guards against a missing value
 * at runtime, because a type says what should be set, not what is.
 */
export interface Env extends Cloudflare.Env {
  /** 32 random bytes, base64. `wrangler secret put JAR_KEY` — rotating it is
   *  the kill switch: every sealed row becomes undecryptable at once. */
  JAR_KEY: string;
  /** Resend's API key. `wrangler secret put RESEND_KEY`. */
  RESEND_KEY: string;
  /** The shared secret Resend signs its delivery webhooks with.
   *  `wrangler secret put RESEND_HOOK`. */
  RESEND_HOOK: string;
}

/**
 * One starred thing, as the browser saw it.
 *
 * Everything past `id` is here because the Worker has no catalogue and will
 * not get one: a uuid alone cannot say what a skin is called, what tier it
 * is, how many levels it has or what colour it is. The browser has all of
 * that on screen at the moment somebody presses the star, so it sends it and
 * the morning mail reads it back.
 */
export interface Starred {
  id: string;
  name: string;
  /** Riot's item type. Only a skin level has a picture whose address can be
   *  derived from the id. */
  type?: string;
  /** The content tier's own word — select, deluxe, premium, exclusive, ultra. */
  tier?: string;
  /** How many of each there are, for the line under the name. */
  levels?: number;
  chromas?: number;
  /** The colour measured off the render, as `r, g, b`. The band in the mail
   *  is the skin's own colour for the same reason the row in the app is. */
  art?: string;
  /** When it was starred, in ms. Stamped here and never taken from the
   *  browser: it is the one field a client could use to make a message claim
   *  something about a past it did not have. */
  at?: number;
}

export interface Hit extends Starred {
  /** What Riot is charging for it today, from the storefront that matched. */
  cost?: number | null;
}
