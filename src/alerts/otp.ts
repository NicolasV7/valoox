// Six digits, ten minutes, five attempts.
//
// Both numbers exist for one reason: six digits is a million guesses, and
// without a ceiling a patient script gets there. Ten minutes bounds how long
// the window is open and five attempts bounds how wide it is — a million
// guesses at five per code is two hundred thousand codes, and each one costs
// an email the sender would notice.
//
// Stored in KV, not D1, because it is the one thing here that should expire on
// its own: a TTL is the whole lifetime rule and there is no cron to forget.
// Stored as a hash, because a code sitting in plaintext in a store anybody can
// dump is a credential sitting in plaintext. The salt is the uid, so one leaked
// hash cannot be looked up against another browser's code.

import type { Env } from '../types.ts';

const MINUTES = 10;
const TRIES = 5;
/** One code a minute. The provider rate-limits too, but a cooldown here is
 *  what stops the button being a mail cannon pointed at one address. */
const COOLDOWN = 60;

export const LIFE = { minutes: MINUTES, tries: TRIES, cooldown: COOLDOWN };

interface Held {
  hash: string;
  /** This code's own id, which the attempt keys hang off. A re-mint gets a new
   *  one, so a fresh code starts at five tries without anything being swept. */
  id: string;
  /** When it stops being valid, so the screen can count down against the same
   *  number the check uses rather than its own guess. */
  until: number;
}

const key = (uid: string) => 'otp:' + uid;
const gate = (uid: string) => 'otp-wait:' + uid;
const tried = (id: string) => 'otp-try:' + id + ':';

/**
 * The hash is salted with the uid AND the address it was sent to.
 *
 * The uid alone meant a code proved only "somebody read a mailbox", and which
 * mailbox was decided by whatever the row happened to say when the code came
 * back. Those can differ: setChannel mails the new address and then writes the
 * row, and a lost compare-and-swap left the row on the old one — so a code
 * proved from an inbox you control could mark an address you do not control
 * verified. Binding the destination makes that a hash mismatch rather than a
 * race nobody wins.
 */
async function digest(uid: string, to: string, code: string): Promise<string> {
  const bytes = new TextEncoder().encode(uid + ':' + to.toLowerCase() + ':' + code);
  const out = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(out)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * How many attempts this code has seen.
 *
 * Counted by listing one key per attempt rather than decrementing a number,
 * because KV has no compare-and-swap: ten thousand verifies fired at once all
 * read `left: 5`, the last writer stored 4, and the ceiling the header above
 * calls the real defence never moved. Distinct keys do not collide, so every
 * attempt in a flood is counted even when they arrive together.
 *
 * Not atomic — KV list is eventually consistent, so a flood can slip a few
 * past the line before the count catches up. Atomic needs a Durable Object,
 * which is a second billable primitive; this turns "unbounded" into "five,
 * give or take", which is the difference that matters.
 */
async function spent(env: Env, id: string): Promise<number> {
  const seen = await env.VAL.list({ prefix: tried(id), limit: TRIES + 1 });
  return seen.keys.length;
}

/** Six digits from the CSPRNG, never Math.random: this is a credential. The
 *  modulo is over 10^6 exactly, so every code is equally likely. */
function six(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] as number;
  return String(n % 1_000_000).padStart(6, '0');
}

/** Seconds left on the cooldown, or 0 when a code may be sent. */
export async function waitFor(env: Env, uid: string): Promise<number> {
  const at = await env.VAL.get(gate(uid));
  if (!at) return 0;
  const left = Math.ceil((Number(at) - Date.now()) / 1000);
  return left > 0 ? left : 0;
}

/** A new code, replacing whatever was outstanding. Returns the code itself —
 *  the only moment it exists in the clear — and when it dies. */
export async function mint(
  env: Env,
  uid: string,
  to: string,
): Promise<{ code: string; until: number }> {
  const code = six();
  const until = Date.now() + MINUTES * 60_000;
  const id = crypto.randomUUID();
  const held: Held = { hash: await digest(uid, to, code), id, until };

  await env.VAL.put(key(uid), JSON.stringify(held), { expirationTtl: MINUTES * 60 });
  await env.VAL.put(gate(uid), String(Date.now() + COOLDOWN * 1000), {
    expirationTtl: COOLDOWN,
  });
  return { code, until };
}

/** Throw the outstanding code away and reopen the button.
 *
 *  For a send that did not go: the code has to be minted before the message
 *  can carry it, so a provider that then refuses leaves a live code nobody
 *  received and a cooldown blocking the retry. Both are undone here. */
export async function clear(env: Env, uid: string): Promise<void> {
  await Promise.all([env.VAL.delete(key(uid)), env.VAL.delete(gate(uid))]);
}

export type Verdict = 'ok' | 'wrong' | 'gone' | 'spent';

/**
 * One attempt. A wrong code spends one of the five and says so; the fifth
 * wrong one deletes the code rather than leaving it to be guessed at leisure.
 *
 * The comparison is on hex digests of equal length, which makes it constant
 * enough: the attempt counter is the real defence and a timing oracle over
 * five tries is not a way in.
 */
export async function check(env: Env, uid: string, to: string, code: string): Promise<Verdict> {
  const raw = await env.VAL.get(key(uid));
  if (!raw) return 'gone';
  const held = JSON.parse(raw) as Held;
  if (Date.now() > held.until) {
    await env.VAL.delete(key(uid));
    return 'gone';
  }

  // Recorded before it is judged, so a guess that arrives alongside nine
  // thousand others still costs one of the five.
  const ttl = Math.max(60, Math.ceil((held.until - Date.now()) / 1000));
  await env.VAL.put(tried(held.id) + crypto.randomUUID(), '1', { expirationTtl: ttl });
  const used = await spent(env, held.id);
  if (used > TRIES) {
    await env.VAL.delete(key(uid));
    return 'spent';
  }

  if ((await digest(uid, to, code)) === held.hash) {
    await env.VAL.delete(key(uid));
    return 'ok';
  }

  if (used >= TRIES) {
    await env.VAL.delete(key(uid));
    return 'spent';
  }
  return 'wrong';
}

/** How many tries are left, for the screen. Null when there is no code. */
export async function left(env: Env, uid: string): Promise<number | null> {
  const raw = await env.VAL.get(key(uid));
  if (!raw) return null;
  return Math.max(0, TRIES - (await spent(env, (JSON.parse(raw) as Held).id)));
}

/**
 * The outstanding code's shape, never its digits.
 *
 * What a screen does with it is skip the send: a code already in a mailbox
 * is a code to type, not a reason to put a second one beside it. Both halves
 * are already visible to whoever holds this browser's cookie — the message
 * is in their inbox — so neither says anything new, and the one thing that
 * would is not here.
 *
 * Keyed by uid alone, so a live code always belongs to the address on the
 * row: setting a different one mints over it.
 */
export async function pending(
  env: Env,
  uid: string,
): Promise<{ until: number; tries: number } | null> {
  const raw = await env.VAL.get(key(uid));
  if (!raw) return null;
  const held = JSON.parse(raw) as Held;
  if (held.until <= Date.now()) return null;
  return { until: held.until, tries: Math.max(0, TRIES - (await spent(env, held.id))) };
}
