import type { Jar } from '../types.ts';

// Pure cookie-jar handling. No network, no storage — all of it unit-testable.
// ponytail: we only ever replay name=value, so attributes are discarded on sight.

export function serialize(jar: Jar): string {
  return Object.entries(jar)
    .map(([k, v]) => k + '=' + v)
    .join('; ');
}

/** Fold a response's Set-Cookie headers into the jar. Returns the same object.
 *  Doing this on every reauth is what keeps a session alive for weeks instead of
 *  days — dropping it is the single most expensive mistake in this flow. */
export function absorb(jar: Jar, res: Response): Jar {
  for (const line of res.headers.getSetCookie()) {
    const pair = line.split(';')[0];
    const i = pair.indexOf('=');
    if (i < 1) continue;
    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();
    if (v && v !== 'deleted') jar[k] = v;
  }
  return jar;
}
