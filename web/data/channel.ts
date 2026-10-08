// The channel, as the three screens that touch it see it.
//
// One fetch behind all of them and one place that knows how to re-read it:
// setting an address, typing a code and being refused are three screens of the
// same object, and three copies of the state is how two of them end up
// disagreeing about whether you are verified.

import { useEffect, useState } from 'preact/hooks';
import * as api from './api.ts';
import { NEEDS_RESEED } from './api.ts';
import type { Prefs } from './types.ts';

let held: Prefs | null = null;
const listeners = new Set<(p: Prefs | null) => void>();

function tell(next: Prefs | null) {
  held = next;
  for (const fn of listeners) fn(next);
}

/** Ask again. Called after anything that changes the address or proves it. */
export async function reload(): Promise<void> {
  const got = await api.prefs().catch(() => null);
  if (got && got !== NEEDS_RESEED) tell(got);
}

export function usePrefs(): Prefs | null {
  const [prefs, set] = useState<Prefs | null>(held);

  useEffect(() => {
    listeners.add(set);
    if (!held) void reload();
    return () => {
      listeners.delete(set);
    };
  }, []);

  return prefs;
}

/** What the provider last said, read as a verdict rather than a sentence.
 *
 *  A 4xx is the address being wrong and it will stay wrong; a bounce or a
 *  complaint is the far end refusing it after the fact. Both mean the same
 *  thing to a person — change the address — which is why both land on the same
 *  screen. Anything else is either fine or still in flight. */
export const refused = (said: string | undefined): boolean =>
  !!said && (/^resend 4/.test(said) || said === 'email.bounced' || said === 'email.complained');

/** Set it and send a code to it. */
export const open = (to: string) =>
  api.post<{ said?: string; error?: string; wait?: number; sent?: boolean }>('/api/channel', {
    to,
  });

/** Another code to the address already stored. */
export const again = () =>
  api.post<{ said?: string; error?: string; wait?: number; sent?: boolean }>(
    '/api/channel/again',
    {},
  );

/** The code, typed back. */
export const prove = (code: string) =>
  api.post<{ ok?: boolean; error?: string; left?: number | null }>('/api/channel/verify', { code });
