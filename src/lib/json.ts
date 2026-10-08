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
