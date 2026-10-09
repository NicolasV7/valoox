import type { Jar } from '../types.ts';
import { UA } from './constants.ts';
import { absorb, serialize } from './jar.ts';
import { assertAllowed } from './upstream.ts';

interface RiotInit extends RequestInit {
  jar?: Jar;
}

/**
 * The ONLY place this service calls Riot. Two jobs:
 *   1. enforce the egress allowlist, so "read-only" is a property of the code
 *   2. carry the cookie jar in and fold the response's cookies back out
 *
 * Logging is status-only and built from literals — never a jar, never a token,
 * and never a URL, because the storefront path contains the puuid.
 */
export async function rf(url: string, init: RiotInit = {}): Promise<Response> {
  const { jar, ...opts } = init;
  const method = (opts.method ?? 'GET').toUpperCase();
  assertAllowed(method, url);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': UA,
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  if (jar) headers.Cookie = serialize(jar);

  const res = await fetch(url, { ...opts, headers });

  // The allowlist is the read-only claim, and `fetch` defaults to following
  // redirects — so without this the check covers the first hop and the request
  // that actually carried the jar or the bearer token went somewhere nobody
  // checked. Riot does not redirect these today; the point is that the claim is
  // true whether or not that stays so. auth.ts passes redirect: 'manual' and
  // reads the Location itself, which is why it never reaches this branch.
  if (res.redirected) assertAllowed(method, res.url);

  console.log(method + ' ' + new URL(url).host + ' -> ' + res.status);
  if (jar) absorb(jar, res);
  return res;
}
