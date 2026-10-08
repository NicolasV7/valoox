// The channel, as the three screens that touch it see it.
//
// One fetch behind all of them and one place that knows how to re-read it:
// setting an address, typing a code and being refused are three screens of the
// same object, and three copies of the state is how two of them end up
// disagreeing about whether you are verified.

import { useEffect, useState } from 'preact/hooks';
import { locale } from '../i18n/index.ts';
import * as api from './api.ts';
import { NEEDS_RESEED } from './api.ts';
import type { Prefs } from './types.ts';

let kept: Prefs | null = null;
const listeners = new Set<(p: Prefs | null) => void>();

/** The copy every screen is rendering. Exposed because the wishlist writes
 *  through it: the stars and the address are one row and one fetch, and two
 *  copies of that row is how a screen ends up disagreeing with itself. */
export const held = (): Prefs | null => kept;

export function tell(next: Prefs | null) {
  kept = next;
  for (const fn of listeners) fn(next);
}

/** Ask again. Called after anything that changes the address or proves it. */
export async function reload(): Promise<void> {
  const got = await api.prefs().catch(() => null);
  if (got && got !== NEEDS_RESEED) tell(got);
}

export function usePrefs(): Prefs | null {
  const [prefs, set] = useState<Prefs | null>(kept);

  useEffect(() => {
    listeners.add(set);
    // Always, not only when there is nothing yet. The row changes behind this
    // page's back — a bounce arrives at the webhook seconds after a send — so
    // a cached copy from before that is exactly the copy that would show a
    // screen saying everything is fine. The held value still paints first, so
    // re-reading costs a request and no flash.
    void reload();
    return () => {
      listeners.delete(set);
    };
  }, []);

  return prefs;
}

/**
 * Keep asking while a screen is waiting on something only the provider can
 * tell us. Used by the code screen: you are sitting there with six empty
 * boxes and the message has already bounced, and nothing on the page would
 * ever say so.
 */
export function useWatch(on: boolean, every = 4000): void {
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      void reload();
    }, every);
    return () => clearInterval(id);
  }, [on, every]);
}

/** What the provider last said, read as a verdict rather than a sentence.
 *
 *  src/vault/mail.ts holds the same list for the send side, which is the one
 *  that enforces it. Two runtimes, so the duplicate is deliberate; if one
 *  changes, change both.
 *
 *  A 4xx is the address being wrong and it will stay wrong. A bounce or a
 *  complaint is the far end refusing it after the fact. A suppression is the
 *  provider declining to try, because one of those already happened. All of
 *  them mean the same thing to a person — change the address — which is why
 *  all of them land on the same screen. Anything else is either fine or still
 *  in flight. */
const DEAD = ['email.bounced', 'email.complained', 'email.suppressed'];

export const refused = (said: string | undefined): boolean =>
  !!said && (/^resend 4/.test(said) || DEAD.includes(said));

/** Whether six digits are already in that mailbox, waiting to be typed.
 *
 *  The server sends when the code dies rather than how long is left, so a
 *  page left open does not go on believing in a code that expired while it
 *  sat there. */
export const waiting = (prefs: Prefs | null): boolean =>
  !!prefs?.code && prefs.code.until > Date.now();

/** The provider saying the message reached a mailbox — its pictures were
 *  fetched from one. Not that a person read it: Apple Mail loads them for
 *  every message whether or not anybody looks. It is enough to stop a second
 *  code going out after the first one landed, and nothing more is claimed of
 *  it. Same two lines as src/vault/mail.ts, which is the one that enforces. */
export const landed = (said: string | undefined): boolean => said === 'email.opened';

/** Set it and send a code to it. */
export const open = (to: string) =>
  api.post<{ said?: string; error?: string; wait?: number; sent?: boolean }>('/api/channel', {
    to,
    // Which language the mail should be in: the one on screen right now.
    lang: locale(),
  });

/** Another code to the address already stored. */
export const again = () =>
  api.post<{ said?: string; error?: string; wait?: number; sent?: boolean }>('/api/channel/again', {
    lang: locale(),
  });

/** The code, typed back. */
export const prove = (code: string) =>
  api.post<{ ok?: boolean; error?: string; left?: number | null }>('/api/channel/verify', { code });
