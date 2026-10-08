// One inbox, one account.
//
// Two browsers verifying the same address would both get the morning message
// and neither would know about the other, which is a thing a person would
// only discover by receiving an alert for a store that is not theirs.
//
// WHEN the check happens is the part worth reading. It is at verify time and
// not at send time, on purpose: refusing a *send* because the address is
// already registered would answer "does this person have a valoox account"
// to anyone who typed their address in, which is an enumeration oracle built
// out of a safety feature. Sending a code to an address costs the asker
// nothing and tells them nothing — only the person holding the mailbox can
// read it, and the refusal waits until they have proved they do.
//
// The key is a hash, so KV holds no addresses. That is the same reason the
// address itself lives sealed inside the session row rather than in a column.

import type { Env } from '../types.ts';

async function key(to: string): Promise<string> {
  const bytes = new TextEncoder().encode(to.trim().toLowerCase());
  const out = await crypto.subtle.digest('SHA-256', bytes);
  return 'addr:' + [...new Uint8Array(out)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Which browser proved this address, if any. */
export const heldBy = async (env: Env, to: string): Promise<string | null> =>
  env.VAL.get(await key(to));

/** Mark it proved by this browser. */
export async function claim(env: Env, to: string, uid: string): Promise<void> {
  await env.VAL.put(await key(to), uid);
}

/** Give it up, but only if it was ours — a stale call must not hand somebody
 *  else's address away. */
export async function release(env: Env, to: string, uid: string): Promise<void> {
  const k = await key(to);
  if ((await env.VAL.get(k)) === uid) await env.VAL.delete(k);
}
