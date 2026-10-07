import type { Env, Jar, RiotHeaders, Tokens } from '../types.ts';
import { AFFINITIES, CLIENT_PLATFORM, REAUTH_URL, VERSION_TTL } from './constants.ts';
import { rf } from './http.ts';

export class RateLimited extends Error {
  constructor() {
    super('rate limited by riot');
    this.name = 'RateLimited';
  }
}

/**
 * Jar -> access token. Returns null when the jar is simply dead (Riot redirects
 * to the login page instead of the redirect_uri), which is the expected end of
 * every session and not an error.
 *
 * The Accept override is load-bearing: /authorize is the browser OAuth flow, and
 * asking for application/json gets a 406 with no Location header — indistinguishable
 * from an expired session unless you look. Measured 2026-09-14.
 */
export async function reauth(jar: Jar): Promise<Tokens | null> {
  const res = await rf(REAUTH_URL, { jar, redirect: 'manual', headers: { Accept: '*/*' } });
  if (res.status === 429) throw new RateLimited();

  const loc = res.headers.get('location');
  if (!loc) throw new Error('reauth got ' + res.status + ' with no redirect (expected 303)');

  const hash = loc.split('#')[1];
  if (!hash) return null; // redirected to the login page => the jar is dead

  const p = new URLSearchParams(hash);
  const access = p.get('access_token');
  return access ? { access, id: p.get('id_token') } : null;
}

export async function entitlements(access: string): Promise<string> {
  const res = await rf('https://entitlements.auth.riotgames.com/api/token/v1', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + access, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const d = (await res.json()) as { entitlements_token?: string };
  if (!d.entitlements_token) throw new Error('entitlements failed: ' + res.status);
  return d.entitlements_token;
}

/** Who this is and where they play. Called once per session, at sign-in. */
export async function identify(
  t: Tokens,
): Promise<{ puuid: string; shard: string; name: string | null }> {
  const bearer = { Authorization: 'Bearer ' + t.access };

  const ui = (await (
    await rf('https://auth.riotgames.com/userinfo', { headers: bearer })
  ).json()) as { sub?: string; acct?: { game_name?: string; tag_line?: string } };

  const geo = (await (
    await rf('https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant', {
      method: 'PUT',
      headers: { ...bearer, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: t.id }),
    })
  ).json()) as { affinities?: { live?: string } };

  const shard = geo?.affinities?.live;
  if (!ui.sub || !shard || !AFFINITIES.includes(shard)) {
    throw new Error('could not resolve puuid/affinity');
  }
  // The name is a nicety, not a requirement: a missing one must not stop a
  // sign-in that otherwise worked.
  const acct = ui.acct;
  const name = acct?.game_name ? acct.game_name + '#' + (acct.tag_line ?? '') : null;
  return { puuid: ui.sub, shard, name };
}

/** A stale X-Riot-ClientVersion may be rejected outright, so keep it fresh.
 *  Public data, cached for an hour — the one cache in the system that holds
 *  nothing about anybody. */
export async function clientVersion(env: Env): Promise<string> {
  const hit = await env.VAL.get('version');
  if (hit) return hit;
  const d = (await (await rf('https://valorant-api.com/v1/version')).json()) as {
    data: { riotClientVersion: string };
  };
  const v = d.data.riotClientVersion;
  await env.VAL.put('version', v, { expirationTtl: VERSION_TTL });
  return v;
}

/** The four headers every authenticated Riot data call must carry. Composed here
 *  because two of them are auth material and one is version-sensitive. */
export async function dataHeaders(env: Env, t: Tokens): Promise<RiotHeaders> {
  const [ent, ver] = await Promise.all([entitlements(t.access), clientVersion(env)]);
  return {
    Authorization: 'Bearer ' + t.access,
    'X-Riot-Entitlements-JWT': ent,
    'X-Riot-ClientPlatform': CLIENT_PLATFORM,
    'X-Riot-ClientVersion': ver,
  };
}
