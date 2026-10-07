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
  console.log(method + ' ' + new URL(url).host + ' -> ' + res.status);
  if (jar) absorb(jar, res);
  return res;
}
