import * as cookie from './app/cookie.ts';
import type { Env, Session, StoreView, Tokens } from './types.ts';
import { runAlerts } from './vault/alerts.ts';
import { identify, reauth } from './vault/auth.ts';
import { fetchInventory, type Inventory } from './vault/inventory.ts';
import * as qr from './vault/qr.ts';
import { prune, setAlerts } from './vault/repo.ts';
import { forget, readCache, readSession, saveSession, writeCache } from './vault/session.ts';
import { fetchStore } from './vault/storefront.ts';

type Body = Record<string, unknown> | StoreView | Inventory | qr.PollResult;

const json = (body: Body, headers: Headers, status = 200): Response => {
  headers.set('Content-Type', 'application/json');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { status, headers });
};

/** Inventory changes only when you buy something. An hour is plenty, and it keeps
 *  a tab refresh from costing a full Riot round trip. */
const INV_TTL = 3600;

/**
 * A session that can talk to Riot right now, or null. Shared by every data route
 * so the reauth-and-heal logic exists once.
 */
async function live(env: Env, uid: string): Promise<{ session: Session; t: Tokens } | null> {
  const held = await readSession(env, uid);
  if (!held) return null;

  const { session, ver } = held;
  const t = await reauth(session.jar);
  if (!t) {
    // Dead at Riot. Keeping the row until the 10-day prune would leave a useless
    // credential sitting in anything that reads the table.
    await forget(env, uid);
    return null;
  }

  // A sign-in that stored the jar but died before identify heals itself here.
  if (!session.puuid || !session.shard) Object.assign(session, await identify(t));

  // The jar was rolled forward by absorb(). Losing the CAS means another tab
  // already persisted a newer jar — theirs wins and ours is dropped on purpose.
  await saveSession(env, uid, session, ver);
  return { session, t };
}

async function store(env: Env, uid: string): Promise<StoreView | { needsReseed: true }> {
  const hit = (await readCache(env, 'store', uid)) as StoreView | null;
  if (hit) return hit;

  const s = await live(env, uid);
  if (!s) return { needsReseed: true };

  const view = await fetchStore(env, s.session, s.t);
  await writeCache(env, 'store', uid, view, view.remaining);
  return view;
}

async function inventory(env: Env, uid: string): Promise<Inventory | { needsReseed: true }> {
  const hit = (await readCache(env, 'inv', uid)) as Inventory | null;
  if (hit) return hit;

  const s = await live(env, uid);
  if (!s) return { needsReseed: true };

  const inv = await fetchInventory(env, s.session, s.t);
  await writeCache(env, 'inv', uid, inv, INV_TTL);
  return inv;
}

const TOPIC_RE = /^[A-Za-z0-9_-]{1,64}$/;
const HOOK_RE = /^[0-9]{15,25}\/[A-Za-z0-9_-]{50,120}$/;
const NTFY_TOKEN_RE = /^tk_[A-Za-z0-9]{1,60}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_WISHLIST = 60;

/** Validated at the edge, before anything is sealed. The topic becomes part of a
 *  URL, so its shape is a security property, not a nicety. */
function cleanPrefs(body: unknown): {
  wishlist: Array<{ id: string; name: string }>;
  notify: NonNullable<Session['notify']>;
} {
  const b = (body ?? {}) as { wishlist?: unknown; notify?: unknown };
  const n = (b.notify ?? {}) as { ntfy?: unknown; ntfyToken?: unknown; discord?: unknown };
  const str = (v: unknown, re: RegExp) => (typeof v === 'string' && re.test(v) ? v : undefined);
  const notify = {
    ntfy: str(n.ntfy, TOPIC_RE),
    ntfyToken: str(n.ntfyToken, NTFY_TOKEN_RE),
    discord: str(n.discord, HOOK_RE),
  };
  const raw = Array.isArray(b.wishlist) ? b.wishlist : [];
  const wishlist = raw
    .filter(
      (w): w is { id: string; name: string } =>
        !!w &&
        typeof w === 'object' &&
        typeof (w as { id?: unknown }).id === 'string' &&
        UUID_RE.test((w as { id: string }).id) &&
        typeof (w as { name?: unknown }).name === 'string',
    )
    .slice(0, MAX_WISHLIST)
    .map((w) => ({ id: w.id, name: w.name.slice(0, 80) }));
  return { wishlist, notify };
}

async function prefs(env: Env, uid: string, body: unknown | null): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return { needsReseed: true };
  const { session, ver } = held;

  if (body !== null) {
    const { wishlist, notify } = cleanPrefs(body);
    session.wishlist = wishlist;
    session.notify = notify;
    await saveSession(env, uid, session, ver);
    // The only preference kept in the clear, and only so the job can find the
    // rows to poll with one indexed query.
    await setAlerts(env, uid, wishlist.length > 0 && !!(notify.ntfy || notify.discord));
  }
  // The ntfy token is write-only: it goes in, it is never handed back out.
  const n = session.notify ?? {};
  return {
    wishlist: session.wishlist ?? [],
    notify: { ntfy: n.ntfy ?? '', discord: n.discord ?? '', hasToken: !!n.ntfyToken },
  };
}

export default {
  /**
   * Abandoned rows are the ones that would sit in a stale dump long after their
   * owner stopped caring. Deleting them beats shortening their life: they are
   * gone, not merely shorter-lived. Active sessions roll their own last_used
   * forward on every visit and are untouched.
   *
   * Honest caveat for the disclosure page: D1 Time Travel retains deleted rows
   * for 7 days with no purge API, so a DELETE is not erasure. Rotating JAR_KEY
   * is what orphans those snapshots.
   */
  async scheduled(
    _event: unknown,
    env: Env,
    ctx: { waitUntil(p: Promise<unknown>): void },
  ): Promise<void> {
    ctx.waitUntil(
      runAlerts(env)
        .then((r) => console.log('alerts checked ' + r.checked + ' sent ' + r.sent))
        .then(() => prune(env))
        .then((n) => console.log('pruned ' + n)),
    );
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    const post = req.method === 'POST';
    const headers = new Headers();

    if (post && !cookie.sameOrigin(req)) {
      return json({ error: 'cross-site' }, headers, 403);
    }

    // A browser with no cookie gets one now: every route below is keyed by it,
    // so nothing is ever shared between two people.
    let uid = cookie.read(req);
    if (!uid) {
      uid = cookie.mint();
      cookie.set(headers, uid);
    }

    try {
      if (pathname === '/api/store') return json(await store(env, uid), headers);
      if (pathname === '/api/inventory') return json(await inventory(env, uid), headers);
      if (pathname === '/api/qr') {
        return json(post ? await qr.start(env, uid) : await qr.poll(env, uid), headers);
      }
      if (pathname === '/api/prefs') {
        return json(await prefs(env, uid, post ? await req.json() : null), headers);
      }
      if (pathname === '/api/logout' && post) {
        await forget(env, uid);
        cookie.clear(headers);
        return json({ ok: true }, headers);
      }
      return new Response('not found', { status: 404 });
    } catch (e) {
      const err = e as Error;
      // Full detail to the log, a short message to the client, the jar to neither.
      console.log('ERROR ' + pathname + ': ' + err.message + '\n' + err.stack);
      return json({ error: err.message }, headers, 502);
    }
  },
};
