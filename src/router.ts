import * as cookie from './app/cookie.ts';
import { interaction } from './discord/interaction.ts';
import { HttpError } from './lib/body.ts';
import type { Body, Ctx } from './lib/json.ts';
import { json } from './lib/json.ts';
import { logout, pollScan, startScan } from './routes/auth.ts';
import { resend, setChannel, verify } from './routes/channel.ts';
import { collection } from './routes/collection.ts';
import { setDiscord } from './routes/discord.ts';
import { resendHook } from './routes/hook.ts';
import { render } from './routes/render.ts';
import { stopMail } from './routes/stop.ts';
import { store } from './routes/store.ts';
import { readWishlist, writeWishlist } from './routes/wishlist.ts';
import { take } from './storage/limits.ts';
import type { Env } from './types.ts';
import { browserId, fingerprint } from './vault/keys.ts';

type Handler = (c: Ctx) => Promise<Body>;
const ROUTES: Record<string, Partial<Record<'GET' | 'POST', Handler>>> = {
  '/api/store': { GET: store },
  '/api/inventory': { GET: collection },
  '/api/qr': { GET: pollScan, POST: startScan },
  '/api/prefs': { GET: readWishlist, POST: writeWishlist },
  '/api/channel': { POST: setChannel },
  '/api/channel/again': { POST: resend },
  '/api/channel/verify': { POST: verify },
  '/api/discord': { POST: setDiscord },
  '/api/stop': { POST: stopMail },
  '/api/logout': { POST: logout },
};
const shell = (req: Request) => new Request(new URL('/', req.url), req);

export async function route(
  req: Request,
  env: Env,
  ctx?: { waitUntil(task: Promise<unknown>): void },
): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  if (['valoox.store', 'www.valoox.store'].includes(url.hostname)) {
    url.hostname = 'drop.valoox.store';
    return Response.redirect(url.toString(), 308);
  }
  const headers = new Headers();
  const method = req.method;
  if (pathname === '/api/hook/discord') return interaction(req, env, ctx);
  if (pathname === '/api/hook/resend') {
    if (method !== 'POST') return json({ error: 'method' }, headers, 405);
    try {
      return await resendHook(req, env);
    } catch (e) {
      return json(
        { error: e instanceof HttpError ? e.message : 'retry' },
        headers,
        e instanceof HttpError ? e.status : 503,
      );
    }
  }
  if (pathname.startsWith('/render/')) {
    return method === 'GET' ? render(req) : json({ error: 'method' }, headers, 405);
  }
  if (!pathname.startsWith('/api/')) {
    return ['GET', 'HEAD'].includes(method)
      ? env.ASSETS.fetch(shell(req))
      : json({ error: 'method' }, headers, 405);
  }
  const routes = ROUTES[pathname];
  if (!routes) return json({ error: 'not found' }, headers, 404);
  if ((method !== 'GET' && method !== 'POST') || !routes[method]) {
    headers.set('Allow', Object.keys(routes).join(', '));
    return json({ error: 'method' }, headers, 405);
  }
  if ((method === 'POST' || pathname === '/api/qr') && !cookie.sameOrigin(req)) {
    return json({ error: 'cross-site' }, headers, 403);
  }
  try {
    const ip = await fingerprint(env, 'edge', req.headers.get('cf-connecting-ip') ?? 'local');
    if (!(await env.EDGE.limit({ key: ip })).success) return limited(headers);
    let secret = cookie.read(req);
    if (!secret) {
      secret = cookie.mint();
      cookie.set(headers, secret);
    }
    const uid = await browserId(env, secret);
    if (pathname === '/api/qr') {
      if (method === 'POST' && (await take(env, 'qr-ip:' + ip, 12, 600))) return limited(headers);
      if (
        await take(
          env,
          'qr:' + method + ':' + uid,
          method === 'POST' ? 3 : 45,
          method === 'POST' ? 600 : 60,
        )
      )
        return limited(headers);
    }
    // Logout must always remain available. OTP has its own stricter atomic gate.
    if (
      method === 'POST' &&
      pathname !== '/api/logout' &&
      (await take(env, 'write:' + uid, 90, 60))
    )
      return limited(headers);
    return json(await (routes[method] as Handler)({ env, uid, req, headers }), headers);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, headers, e.status);
    // Exception messages/stacks can contain upstream credential URLs.
    console.log('route failed');
    return json({ error: 'upstream' }, headers, 502);
  }
}
function limited(headers: Headers): Response {
  headers.set('Retry-After', '60');
  return json({ error: 'rate limited' }, headers, 429);
}
