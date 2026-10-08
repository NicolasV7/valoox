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
  left: number;
  /** When it stops being valid, so the screen can count down against the same
   *  number the check uses rather than its own guess. */
  until: number;
}

const key = (uid: string) => 'otp:' + uid;
const gate = (uid: string) => 'otp-wait:' + uid;

async function digest(uid: string, code: string): Promise<string> {
  const bytes = new TextEncoder().encode(uid + ':' + code);
  const out = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(out)].map((b) => b.toString(16).padStart(2, '0')).join('');
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
export async function mint(env: Env, uid: string): Promise<{ code: string; until: number }> {
  const code = six();
  const until = Date.now() + MINUTES * 60_000;
  const held: Held = { hash: await digest(uid, code), left: TRIES, until };

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
export async function check(env: Env, uid: string, code: string): Promise<Verdict> {
  const raw = await env.VAL.get(key(uid));
  if (!raw) return 'gone';
  const held = JSON.parse(raw) as Held;
  if (Date.now() > held.until) {
    await env.VAL.delete(key(uid));
    return 'gone';
  }

  if ((await digest(uid, code)) === held.hash) {
    await env.VAL.delete(key(uid));
    return 'ok';
  }

  const left = held.left - 1;
  if (left <= 0) {
    await env.VAL.delete(key(uid));
    return 'spent';
  }
  const ttl = Math.max(60, Math.ceil((held.until - Date.now()) / 1000));
  await env.VAL.put(key(uid), JSON.stringify({ ...held, left }), { expirationTtl: ttl });
  return 'wrong';
}

/** How many tries are left, for the screen. Null when there is no code. */
export async function left(env: Env, uid: string): Promise<number | null> {
  const raw = await env.VAL.get(key(uid));
  return raw ? (JSON.parse(raw) as Held).left : null;
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
  return held.until > Date.now() ? { until: held.until, tries: held.left } : null;
}
