import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import type { Env } from '../types.ts';
import { setAlerts } from '../vault/repo.ts';
import { readSession, saveSession } from '../vault/session.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX = 60;

/**
 * A Discord webhook, from whatever was pasted.
 *
 * Accepts the whole URL, because that is what the Copy button in Discord gives
 * you, and keeps only the id and the token. A URL is never stored and never
 * reaches fetch(): the host is pinned in the allowlist, and these two halves
 * are the only user-supplied text that gets anywhere near it. Neither half can
 * contain a slash, a dot or an @, so neither can walk out of the path.
 */
const HOOK =
  /^(?:https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/)?([0-9]{15,25}\/[A-Za-z0-9_-]{50,120})$/;

function cleanHook(body: unknown): string | undefined {
  const n = ((body ?? {}) as { notify?: { discord?: unknown } }).notify;
  const raw = typeof n?.discord === 'string' ? n.discord.trim() : '';
  return HOOK.exec(raw)?.[1];
}

/** Validated at the edge, before anything is sealed. */
function cleanWishlist(body: unknown): Array<{ id: string; name: string }> {
  const raw = ((body ?? {}) as { wishlist?: unknown }).wishlist;
  return (Array.isArray(raw) ? raw : [])
    .filter(
      (w): w is { id: string; name: string } =>
        !!w &&
        typeof w === 'object' &&
        typeof (w as { id?: unknown }).id === 'string' &&
        UUID.test((w as { id: string }).id) &&
        typeof (w as { name?: unknown }).name === 'string',
    )
    .slice(0, MAX)
    .map((w) => ({ id: w.id, name: w.name.slice(0, 80) }));
}

export const readWishlist = ({ env, uid }: Ctx): Promise<Body> => wishlist(env, uid, null);

export const writeWishlist = async ({ env, uid, req }: Ctx): Promise<Body> =>
  wishlist(env, uid, await req.json());

/** Somewhere to put a hit. A verified address counts; an unverified one does
 *  not, which is the same rule the send side enforces. */
const hasChannel = (s: { notify?: { discord?: string }; mail?: { ok: boolean } }) =>
  !!s.notify?.discord || s.mail?.ok === true;

async function wishlist(env: Env, uid: string, body: unknown | null, retry = true): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const { session, ver } = held;

  if (body !== null) {
    const discord = cleanHook(body);
    session.wishlist = cleanWishlist(body);
    session.notify = discord ? { discord } : {};

    if (!(await saveSession(env, uid, session, ver))) {
      // Another tab wrote first; theirs is the stored session. Re-read once
      // rather than overwrite, and say so if it happens twice.
      if (retry) return wishlist(env, uid, body, false);
      return { conflict: true };
    }
    // The only preference kept in the clear, and only so the daily job can find
    // the rows to poll without opening every sealed blob in the table.
    await setAlerts(env, uid, session.wishlist.length > 0 && hasChannel(session));
  }
  return {
    wishlist: session.wishlist ?? [],
    discord: session.notify?.discord ?? '',
    // The address itself, never a code and never a secret: the browser needs
    // it to show you what it is about to write to. `said` is the provider's
    // own last word, passed through unchanged so no screen can soften it.
    mail: session.mail
      ? { to: session.mail.to, ok: session.mail.ok, said: session.mail.said ?? '' }
      : null,
  };
}
