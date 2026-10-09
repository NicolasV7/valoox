import type { Env } from '../types.ts';

/** Everything a route hands back, before it becomes a Response. */
export type Body = Record<string, unknown>;

/** What every route is given. The uid is already minted and already on the way
 *  back in `headers`, so a route never has to think about the cookie. */
export interface Ctx {
  env: Env;
  uid: string;
  req: Request;
  headers: Headers;
}

/** no-store on all of it. A storefront is per-account and a cache between here
 *  and the browser would be a cache of somebody's account. */
export const json = (body: Body, headers: Headers, status = 200): Response => {
  headers.set('Content-Type', 'application/json');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { status, headers });
};

/** The one answer that is not an error: there is no session this Worker can
 *  open, so the browser shows the way in. */
export const RESEED = { needsReseed: true } as const;

/**
 * The same answer, about a session that existed until a moment ago.
 *
 * Riot refused the stored cookies and the row has just been deleted. It is
 * not an error and there is nothing to retry, but it is a different sentence
 * from "you have never signed in" — and a returning person should get the
 * one that is about them rather than a stranger's.
 *
 * `expired` is all it says. Riot's own reason is in a body this Worker does
 * not parse and would not pass on: a page cannot quote a slug it was never
 * given, and the screen says so instead of printing one.
 */
export const EXPIRED = { needsReseed: true, expired: true } as const;
