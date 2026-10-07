import assert from 'node:assert';
import { test } from 'vitest';
import { allowCount, assertAllowed } from '../../src/vault/upstream.ts';

const PUUID = '1aefc04b-4455-8b2f-6332-79b4260aaffe';
const TYPE = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

const ok = (m: string, u: string) => assert.doesNotThrow(() => assertAllowed(m, u), m + ' ' + u);
const no = (m: string, u: string) =>
  assert.throws(() => assertAllowed(m, u), /not allowed/, 'should be blocked: ' + m + ' ' + u);

test('the endpoints the product actually needs are allowed', () => {
  ok('GET', 'https://auth.riotgames.com/.well-known/openid-configuration');
  ok('GET', 'https://auth.riotgames.com/authorize?redirect_uri=x&client_id=play-valorant-web-prod');
  ok('GET', 'https://auth.riotgames.com/userinfo');
  ok('POST', 'https://auth.riotgames.com/api/v1/authorization');
  ok('POST', 'https://auth.riotgames.com/api/v1/login-token');
  ok('GET', 'https://authenticate.riotgames.com/api/v1/login');
  ok('POST', 'https://authenticate.riotgames.com/api/v1/login');
  ok('POST', 'https://entitlements.auth.riotgames.com/api/token/v1');
  ok('PUT', 'https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant');
  ok('POST', 'https://pd.na.a.pvp.net/store/v3/storefront/' + PUUID);
  ok('GET', 'https://pd.eu.a.pvp.net/store/v1/wallet/' + PUUID);
  ok('GET', 'https://pd.kr.a.pvp.net/store/v1/entitlements/' + PUUID + '/' + TYPE);
  ok('GET', 'https://valorant-api.com/v1/version');
});

// THE POINT OF THE MODULE. These exist at Riot and a stolen jar reaches them.
// No code path here can, and this test is what keeps that true.
test('state-changing Riot endpoints are unreachable', () => {
  no('PUT', 'https://pd.na.a.pvp.net/personalization/v2/players/' + PUUID + '/playerloadout');
  no('POST', 'https://glz-na-1.na.a.pvp.net/parties/v1/players/' + PUUID);
  no('POST', 'https://pd.na.a.pvp.net/contracts/v1/contracts/' + PUUID + '/special/x');
  no('POST', 'https://pd.na.a.pvp.net/store/v1/orders/' + PUUID);
  no('PUT', 'https://pd.na.a.pvp.net/name-service/v2/players');
  no('POST', 'https://auth.riotgames.com/api/v1/account/password');
});

test('shards that do not resolve are refused before DNS can fail', () => {
  // pd.latam and pd.br have no DNS record: a Cloudflare 1016 behind a 530 that
  // looks nothing like a region problem. Cheaper to refuse here.
  no('POST', 'https://pd.latam.a.pvp.net/store/v3/storefront/' + PUUID);
  no('POST', 'https://pd.br.a.pvp.net/store/v3/storefront/' + PUUID);
});

test('the method is part of the rule, not just the URL', () => {
  no('DELETE', 'https://pd.na.a.pvp.net/store/v1/wallet/' + PUUID);
  no('POST', 'https://auth.riotgames.com/userinfo');
  no('GET', 'https://pd.na.a.pvp.net/store/v3/storefront/' + PUUID); // storefront is POST
});

test('no path traversal or host confusion sneaks past', () => {
  no('GET', 'https://pd.na.a.pvp.net.evil.com/store/v1/wallet/' + PUUID);
  no('GET', 'https://evil.com/https://pd.na.a.pvp.net/store/v1/wallet/' + PUUID);
  no('GET', 'http://pd.na.a.pvp.net/store/v1/wallet/' + PUUID); // http, not https
  no('GET', 'https://pd.na.a.pvp.net/store/v1/wallet/' + PUUID + '/../../orders');
  no('GET', 'https://pd.na.a.pvp.net/store/v1/wallet/not-a-uuid');
});

test('the ntfy topic cannot escape its host', () => {
  // The topic is the ONLY user-influenced text in any URL this service builds.
  // If it could carry a slash, a dot or an @, this rule would be an open SSRF
  // with our egress reputation attached to it.
  ok('POST', 'https://ntfy.sh/a-build-topic');
  ok('POST', 'https://ntfy.sh/A_b-9');
  no('POST', 'https://ntfy.sh/topic/../../evil');
  no('POST', 'https://ntfy.sh/topic?x=1');
  no('POST', 'https://ntfy.sh/a.b');
  no('POST', 'https://ntfy.sh/');
  no('POST', 'https://ntfy.sh/' + 'x'.repeat(65));
  no('POST', 'https://ntfy.sh@evil.com/topic');
  no('POST', 'https://ntfyXsh/topic');
  no('GET', 'https://ntfy.sh/topic');
});

test('a Discord webhook cannot escape its path either', () => {
  const HOOK = '123456789012345678/' + 'a'.repeat(68);
  ok('POST', 'https://discord.com/api/webhooks/' + HOOK);
  no('POST', 'https://discord.com/api/webhooks/' + HOOK + '/extra');
  no('POST', 'https://discord.com/api/webhooks/abc/' + 'a'.repeat(68));
  no('POST', 'https://discord.com/api/webhooks/123456789012345678/short');
  no('POST', 'https://discordXcom/api/webhooks/' + HOOK);
  no('GET', 'https://discord.com/api/webhooks/' + HOOK);
});

test('rank is readable, and only ever for a well-formed puuid', () => {
  // The puuid can only come from the sealed session, never off a request — so
  // there is no path that reads someone else's rank, which Riot calls scouting.
  ok('GET', 'https://pd.na.a.pvp.net/mmr/v1/players/' + PUUID);
  no('GET', 'https://pd.na.a.pvp.net/mmr/v1/players/' + PUUID + '/competitiveupdates');
  no('GET', 'https://pd.na.a.pvp.net/mmr/v1/players/not-a-uuid');
  no('POST', 'https://pd.na.a.pvp.net/mmr/v1/players/' + PUUID);
  no('GET', 'https://pd.latam.a.pvp.net/mmr/v1/players/' + PUUID);
});

test('the list stays short enough to read in one sitting', () => {
  // If this fails, someone added an endpoint. That is allowed — but it should be
  // a deliberate edit to this number, with a look at what was added.
  assert.equal(allowCount, 17);
});
