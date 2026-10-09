// How long before another code may be sent.
//
// Split out of otp.ts because it is a different subject: that file is about
// whether a code is right, and this one is about who is allowed to ask for
// another. They shared a file until the second gate arrived and pushed it past
// two hundred lines, which is the seam the limit exists to find.
//
// TWO gates, and the second is the one that matters.
//
// The per-browser gate stops one session being a mail cannon pointed at ONE
// address. It does nothing about a session pointed at a different stranger
// every minute — which is the shape that gets a sending domain blocked, and
// the person being mailed never asked this app for anything. So the address
// carries a gate of its own, and the wait is the longer of the two.

import type { Env } from '../types.ts';

/** One code a minute. The provider rate-limits too, but a cooldown here is
 *  what stops the button being a mail cannon pointed at one address. */
export const COOLDOWN = 60;

const gate = (uid: string) => 'otp-wait:' + uid;

/** Hashed, because a listing of KV keys is not a place to keep a list of the
 *  addresses this app has mailed. Eight bytes is plenty to separate them and
 *  far too few to walk backwards. */
async function toGate(to: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(to.toLowerCase()));
  return (
    'otp-to:' +
    [...new Uint8Array(d).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('')
  );
}

/** Seconds left, or 0 when a code may be sent. The longer of the two gates. */
export async function waitFor(env: Env, uid: string, to?: string): Promise<number> {
  const [mine, theirs] = await Promise.all([
    env.VAL.get(gate(uid)),
    to ? env.VAL.get(await toGate(to)) : null,
  ]);
  const at = Math.max(Number(mine ?? 0), Number(theirs ?? 0));
  const left = Math.ceil((at - Date.now()) / 1000);
  return left > 0 ? left : 0;
}

/** Shut both gates for the cooldown. */
export async function hold(env: Env, uid: string, to: string): Promise<void> {
  const open = String(Date.now() + COOLDOWN * 1000);
  await Promise.all([
    env.VAL.put(gate(uid), open, { expirationTtl: COOLDOWN }),
    env.VAL.put(await toGate(to), open, { expirationTtl: COOLDOWN }),
  ]);
}

/** Open them again. For a send that did not go: a provider that refuses after
 *  the code was minted would otherwise lock the button for a minute over a
 *  message that never left. */
export async function release(env: Env, uid: string, to?: string): Promise<void> {
  await Promise.all([env.VAL.delete(gate(uid)), to ? env.VAL.delete(await toGate(to)) : null]);
}
