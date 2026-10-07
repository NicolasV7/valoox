// Every magic string Riot requires, in one place with its provenance.

/** pd.* and authenticate.* run Browser Integrity Check against a case-sensitive
 *  User-Agent blocklist. A benign RiotClient UA passes; measured 2026-09-14 that
 *  this exact (old) build string still gets 303 from /authorize. */
export const UA = 'RiotClient/24.9.1.4445 rso-auth (Windows;10;;Professional, x64)';

/** Base64 of the PC platform JSON. A fixed literal, identical across every known
 *  project — it is not per-user and not per-version. */
export const CLIENT_PLATFORM =
  'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9';

/** Currency ids. The accessory store prices in Kingdom Credits, not VP — reading
 *  Cost[VP] there silently yields null for every item. */
export const VP = '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741';
export const RAD = 'e59aa87c-4cbf-517a-5983-6e81511be9b7';
export const KC = '85ca954a-41f2-ce94-9b45-8ca3dd39a00d';

/** The reauth URL. Note it is the browser OAuth flow, so the Accept header must
 *  NOT be application/json — Riot answers 406 with no Location, which reads
 *  exactly like an expired session. Measured 2026-09-14. */
export const REAUTH_URL =
  'https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in' +
  '&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid';

/** Affinities riot-geo may return. Not the same set as the shard hosts. */
export const AFFINITIES = ['ap', 'br', 'esports', 'eu', 'kr', 'latam', 'na', 'pbe'];

/** How long a cached client version stays fresh, in seconds. */
export const VERSION_TTL = 3600;

/** How long a half-finished QR scan may sit before it is abandoned, in seconds. */
export const SCAN_TTL = 600;
