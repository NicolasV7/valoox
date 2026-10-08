import * as cookie from './app/cookie.ts';
import type { Body, Ctx } from './lib/json.ts';
import { json } from './lib/json.ts';
import { testAlert } from './routes/alerts.ts';
import { logout, pollScan, startScan } from './routes/auth.ts';
import { resend, setChannel, verify } from './routes/channel.ts';
import { collection } from './routes/collection.ts';
import { resendHook } from './routes/hook.ts';
import { render } from './routes/render.ts';
import { stopMail } from './routes/stop.ts';
import { store } from './routes/store.ts';
import { readWishlist, writeWishlist } from './routes/wishlist.ts';
import type { Env } from './types.ts';

type Handler = (c: Ctx) => Promise<Body>;

/**
 * Every route, with its method.
 *
 * A table rather than an if-chain, and the method is half of each entry for the
 * same reason it is half of every rule in the egress allowlist: GET and POST on
 * one path are two different things, and writing them as one is how a read
 * quietly acquires a write.
 */
const ROUTES: Record<string, Partial<Record<'GET' | 'POST', Handler>>> = {
  '/api/store': { GET: store },
  '/api/inventory': { GET: collection },
  '/api/qr': { GET: pollScan, POST: startScan },
  '/api/prefs': { GET: readWishlist, POST: writeWishlist },
  '/api/channel': { POST: setChannel },
  '/api/channel/again': { POST: resend },
  '/api/channel/verify': { POST: verify },
  '/api/stop': { POST: stopMail },
  '/api/test-alert': { POST: testAlert },
  '/api/logout': { POST: logout },
};

/** The same request, pointed at the one asset that is the application. */
const shell = (req: Request) => new Request(new URL('/', req.url), req);

/**
 * Where the app lives.
 *
 * The apex is the landing page's address, not the app's, and the two are
 * different things: one is read by somebody deciding whether to sign in, the
 * other holds a Riot session. Keeping them on separate hosts means the cookie
 * is scoped to the app alone and the landing page can be a flat file with no
 * reason to touch it.
 *
 * Until the landing exists, the apex is a signpost. 308 and not 302 so the
 * method and body survive — anything POSTing to the old address still lands,
 * and the browser remembers for next time.
 */
const APP = 'drop.valoox.store';

function signpost(url: URL): Response | null {
  if (url.hostname !== 'valoox.store' && url.hostname !== 'www.valoox.store') return null;
  const to = new URL(url.toString());
  to.hostname = APP;
  return Response.redirect(to.toString(), 308);
}

export async function route(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;

  // Before anything reads a cookie: the apex has no session of its own and
  // must not be given one.
  const away = signpost(url);
  if (away) return away;
  const method = req.method === 'POST' ? 'POST' : 'GET';
  const headers = new Headers();

  // The one caller that is not a browser, and so the one that must come before
  // the same-origin check: a provider's webhook is cross-site by definition and
  // that check would be right to refuse it. Its signature is what stands in,
  // and it is strictly the stronger of the two — see routes/hook.ts.
  if (pathname === '/api/hook/resend') {
    return method === 'POST' ? resendHook(req, env) : json({ error: 'not found' }, headers, 404);
  }

  // The one route that answers with a picture rather than JSON, and the one
  // whose answer is the same for everybody. Before the cookie, because it
  // needs no session and a message should not be minting one.
  if (pathname.startsWith('/render/')) {
    return method === 'GET' ? render(req) : json({ error: 'not found' }, headers, 404);
  }

  // The whole CSRF defence, and it is enough: a cross-site form post cannot set
  // this header, and a same-origin fetch always does.
  if (method === 'POST' && !cookie.sameOrigin(req)) {
    return json({ error: 'cross-site' }, headers, 403);
  }

  // A browser with no cookie gets one now: every route is keyed by it, so
  // nothing is ever shared between two people.
  let uid = cookie.read(req);
  if (!uid) {
    uid = cookie.mint();
    cookie.set(headers, uid);
  }

  // Everything that is not /api/* is an app route. /offer/<uuid> is a real URL
  // — that is the whole reason the front end routes on the path rather than
  // keeping the open offer in a variable — so a reload or a link somebody sent
  // has to come back as the page, not as this Worker's opinion of the path.
  // The client decides what an unknown one means, and its answer is the store.
  if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(shell(req));

  const handler = ROUTES[pathname]?.[method];
  // 404 with the headers, so a first-time visitor who mistypes an endpoint
  // still keeps the uid that was just minted for them.
  if (!handler) return json({ error: 'not found' }, headers, 404);

  try {
    return json(await handler({ env, uid, req, headers }), headers);
  } catch (e) {
    const err = e as Error;
    // Full detail to the log, a status to the client, the jar to neither. The
    // pathname here is one of ours; a Riot path would carry the puuid.
    console.log('ERROR ' + pathname + ': ' + err.message + '\n' + err.stack);
    return json({ error: 'upstream' }, headers, 502);
  }
}
