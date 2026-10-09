import { pending } from '../alerts/otp.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import type { Env, Starred } from '../types.ts';
import { setAlerts } from '../vault/repo.ts';
import { readSession, saveSession } from '../vault/session.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The five words /v1/contenttiers uses, and no others. */
const TIER = /^(select|deluxe|premium|exclusive|ultra)$/;

/** `r, g, b` and nothing else. This string is written into a style attribute
 *  in an email, so it is pinned to the shape rather than merely trimmed. */
const ART = /^\d{1,3}, \d{1,3}, \d{1,3}$/;
/** Riot's item type for a skin level, which is how a gun is told from an
 *  accessory without a catalogue. A row with no type, or one whose type is not
 *  a uuid, counts as a gun — that is how the browser reads it too, and the two
 *  sides disagreeing is how a cap gets walked around. */
const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

/** Two ceilings, one per rotation. Guns rotate daily and four at a time;
 *  accessories rotate weekly. The limit is about the row either way — the
 *  whole wishlist rides in one sealed blob and the daily job is a set
 *  intersection — so these are product numbers, not budget ones. */
const GUNS = 50;
const BITS = 100;

const isGun = (w: { type?: unknown }): boolean =>
  typeof w.type !== 'string' || !UUID.test(w.type) || w.type === LEVELS;

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

/**
 * Validated at the edge, before anything is sealed.
 *
 * Every field past the id is the browser's, because the Worker has no
 * catalogue to check a uuid against and never will: what a skin is called,
 * what tier it is, how many levels and colourways it has, and what colour it
 * measured — all of it is on screen at the moment somebody presses the star,
 * and none of it is derivable here.
 *
 * `at` is the exception and is stamped on this side. A row that already had
 * one keeps it, so saving the list does not reset how long you have been
 * waiting; a new row is stamped now. Taking it from the browser would let a
 * client make a message say "you starred this 400 days ago" about a star it
 * pressed a second earlier, which is the only field here with that shape.
 */
export function cleanWishlist(body: unknown, was: Starred[] = []): Starred[] {
  const raw = ((body ?? {}) as { wishlist?: unknown }).wishlist;
  const when = new Map(was.map((w) => [w.id, w.at]));
  const now = Date.now();

  const num = (v: unknown, cap: number): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(Math.round(v), cap) : undefined;

  // Counted as they pass, so the first fifty guns and the first hundred
  // accessories survive — rather than one slice a hundred accessories could
  // use up before a gun got a look in.
  let guns = 0;
  let bits = 0;

  return (raw && Array.isArray(raw) ? raw : [])
    .filter(
      (w): w is Starred =>
        !!w &&
        typeof w === 'object' &&
        typeof (w as { id?: unknown }).id === 'string' &&
        UUID.test((w as { id: string }).id) &&
        typeof (w as { name?: unknown }).name === 'string',
    )
    .filter((w) => (isGun(w) ? ++guns <= GUNS : ++bits <= BITS))
    .map((w) => {
      // Control characters out before the length cap. This string is the one
      // piece of free text the browser stores, and it is read back into an
      // email subject and an email body — a newline in a subject is a header
      // in anything that is not Resend's JSON API.
      const name = w.name.replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, ' ');
      const keep: Starred = { id: w.id, name: name.slice(0, 80), at: when.get(w.id) ?? now };
      if (typeof w.type === 'string' && UUID.test(w.type)) keep.type = w.type;
      if (typeof w.tier === 'string' && TIER.test(w.tier)) keep.tier = w.tier;
      // Three numbers and nothing else: it goes straight into a style
      // attribute in a message, which is the one place in this app that
      // builds markup from a string.
      if (typeof w.art === 'string' && ART.test(w.art)) keep.art = w.art;
      const levels = num(w.levels, 9);
      const chromas = num(w.chromas, 99);
      if (levels) keep.levels = levels;
      if (chromas) keep.chromas = chromas;
      return keep;
    });
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
    session.wishlist = cleanWishlist(body, session.wishlist ?? []);
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
    // Whether six digits are already sitting in that mailbox. A screen that
    // did not know this offered to send a second one beside the first.
    code: await pending(env, uid),
  };
}
