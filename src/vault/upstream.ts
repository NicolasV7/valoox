// THE EGRESS ALLOWLIST.
//
// This is the whole "read-only" claim, expressed as code a stranger can check.
// Every outbound request to Riot passes through here first. Nothing user-supplied
// ever reaches fetch(): the shard comes from a fixed set, and the puuid comes from
// the stored session, never off a request.
//
// DELIBERATELY ABSENT, and this is the point — these endpoints exist at Riot and
// a stolen jar reaches them, but no code path here can:
//   · PUT  /personalization/v2/players/{puuid}/playerloadout   (equip a loadout —
//     the GET on that same path IS allowed, which is the clearest example of why
//     the method is half of every rule here)
//   · POST /matchmaking/v1/parties/{party}/matchmaking/join     (enter queue)
//   · POST /parties/v1/players/{puuid}                          (party)
//   · POST /contracts/v1/contracts/{puuid}/special/{contract}   (activate contract)
//   · anything under /chat/, /name-service/, or /store/v1/orders (purchases)
//
// The four writes below are all authentication handshake steps. None of them
// changes anything about the account or the game.

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** A Discord webhook: numeric id, then an opaque token. This is the only
 *  user-influenced text in any URL this file builds, and neither half can
 *  contain a slash, a dot or an @, so neither can walk out of the path. */
export const HOOK = '[0-9]{15,25}/[A-Za-z0-9_-]{50,120}';

/** The shard hosts that resolve. latam and br have no DNS record at all. */
export const SHARD_HOSTS = ['na', 'eu', 'ap', 'kr'] as const;

const PD = 'pd\\.(?:' + SHARD_HOSTS.join('|') + ')\\.a\\.pvp\\.net';

interface Rule {
  method: string;
  pattern: RegExp;
  why: string;
}

const ALLOW: Rule[] = [
  // --- authentication handshake -------------------------------------------
  {
    method: 'GET',
    pattern: /^https:\/\/auth\.riotgames\.com\/\.well-known\/openid-configuration$/,
    why: 'warms the cookie jar before a QR scan',
  },
  {
    method: 'GET',
    pattern: /^https:\/\/auth\.riotgames\.com\/authorize\?/,
    why: 'reauth: jar in, access_token out of the Location fragment',
  },
  {
    method: 'GET',
    pattern: /^https:\/\/auth\.riotgames\.com\/userinfo$/,
    why: 'resolves the puuid once, at sign-in',
  },
  {
    method: 'POST',
    pattern: /^https:\/\/auth\.riotgames\.com\/api\/v1\/authorization$/,
    why: 'issues the ssid cookie at the end of a QR scan',
  },
  {
    method: 'POST',
    pattern: /^https:\/\/auth\.riotgames\.com\/api\/v1\/login-token$/,
    why: 'swaps the scanned login_token for a session',
  },
  {
    method: 'GET',
    pattern: /^https:\/\/authenticate\.riotgames\.com\/api\/v1\/login$/,
    why: 'polls for the scan to be approved in Riot Mobile',
  },
  {
    method: 'POST',
    pattern: /^https:\/\/authenticate\.riotgames\.com\/api\/v1\/login$/,
    why: 'opens a QR session',
  },
  {
    method: 'POST',
    pattern: /^https:\/\/entitlements\.auth\.riotgames\.com\/api\/token\/v1$/,
    why: 'mints the entitlements JWT the storefront requires',
  },
  {
    method: 'PUT',
    pattern: /^https:\/\/riot-geo\.pas\.si\.riotgames\.com\/pas\/v1\/product\/valorant$/,
    why: 'resolves the affinity once, at sign-in',
  },

  // --- reads. this is the entire product ----------------------------------
  {
    method: 'POST',
    pattern: new RegExp('^https://' + PD + '/store/v3/storefront/' + UUID + '$'),
    why: 'the daily store. POST with an empty body; it is a read despite the verb',
  },
  {
    method: 'GET',
    pattern: new RegExp('^https://' + PD + '/store/v1/wallet/' + UUID + '$'),
    why: 'VP / Radianite / Kingdom Credits balances',
  },
  {
    method: 'GET',
    pattern: new RegExp('^https://' + PD + '/store/v1/entitlements/' + UUID + '/' + UUID + '$'),
    why: 'what the account already owns, of one item type',
  },
  {
    method: 'GET',
    pattern: new RegExp('^https://' + PD + '/store/v1/entitlements/' + UUID + '$'),
    why: 'the whole collection in one call, grouped by type — no type list to guess',
  },
  {
    method: 'GET',
    pattern: new RegExp('^https://' + PD + '/mmr/v1/players/' + UUID + '$'),
    why: 'your own rank. The puuid can only come from your own sealed session — looking up anyone else is scouting, which Riot names as a prohibited use',
  },
  {
    method: 'GET',
    pattern: new RegExp(
      '^https://' + PD + '/personalization/v2/players/' + UUID + '/playerloadout$',
    ),
    why: 'the equipped player card, which the header draws behind your name. Reading a loadout changes nothing; the PUT that equips one is not on this list',
  },

  // --- notifications ------------------------------------------------------
  // The user supplies an id and a token, never a URL. Pinning the host here is
  // what keeps the rule that nothing user-supplied reaches fetch() — otherwise
  // this route would be an open SSRF with our egress reputation attached.
  {
    method: 'POST',
    pattern: new RegExp('^https://discord\\.com/api/webhooks/' + HOOK + '$'),
    why: 'delivers a wishlist hit; carries no credential and no puuid. Throttled per webhook, which is the only kind of limit a Worker can own',
  },

  // --- public, unauthenticated --------------------------------------------
  {
    method: 'GET',
    pattern: /^https:\/\/valorant-api\.com\/v1\/version$/,
    why: 'the X-Riot-ClientVersion header; public data, no credential sent',
  },
];

export class BlockedUpstream extends Error {
  constructor(method: string, url: string) {
    super('upstream not allowed: ' + method + ' ' + url.split('?')[0]);
    this.name = 'BlockedUpstream';
  }
}

/** Throws unless this exact method+URL is on the list above. */
export function assertAllowed(method: string, url: string): void {
  const m = method.toUpperCase();
  if (!ALLOW.some((r) => r.method === m && r.pattern.test(url))) {
    throw new BlockedUpstream(m, url);
  }
}

/** Exposed so a test can assert the list has not silently grown. */
export const allowCount = ALLOW.length;
