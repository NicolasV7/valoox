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

  // Never followed, and this is the line that makes the check above mean what
  // it says. `fetch` follows redirects by default, and a followed redirect is
  // a second request to a URL nobody checked — carrying the jar, or the
  // bearer token, to wherever the first hop pointed.
  //
  // It used to re-check after the fact: `if (res.redirected) assertAllowed(...)`.
  // That reads like a guard and is not one. By the time `redirected` is true
  // the credential has already been sent; throwing then is a report, not a
  // refusal. The claim on this file is that assertAllowed runs BEFORE fetch,
  // and with a followed redirect that was not true of the second hop.
  //
  // Nothing needs the follow. Every caller was checked: only auth.ts expects a
  // 30x at all, it already asked for 'manual', and it reads the Location
  // itself. A caller that gets an unexpected 30x now fails loudly instead of
  // quietly succeeding somewhere else, which is the right direction for this
  // failure. A caller may still opt in by passing its own `redirect`.
  const res = await fetch(url, { redirect: 'manual', ...opts, headers });

  console.log(method + ' ' + new URL(url).host + ' -> ' + res.status);
  if (jar) absorb(jar, res);
  return res;
}
