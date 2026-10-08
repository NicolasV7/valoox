// The indexes the other tabs will want, fetched while nobody is waiting.
//
// Switching from Sprays to Buddies is 60ms of rendering and up to a second of
// downloading the buddies catalogue, and the second one is the one you feel.
// Both are already cached for the life of the page once asked for, so the fix
// is only ever about *when* — and the moment after a collection tab has
// painted is time the phone is not otherwise using.
//
// requestIdleCallback rather than a bare call, so it never competes with the
// tab you actually opened. Safari does not have it; there the timeout is the
// whole mechanism, which is fine because the point is "later", not "idle".

import { buddies } from './buddies.ts';
import { cards } from './cards.ts';
import { sprays } from './sprays.ts';
import { titles } from './titles.ts';

let done = false;

/** Called by a collection tab once it has something on screen. Harmless to
 *  call again: the fetches behind these remember their own answers. */
export function warm(): void {
  if (done) return;
  done = true;
  const soon = (fn: () => void) =>
    'requestIdleCallback' in window
      ? requestIdleCallback(fn, { timeout: 4000 })
      : setTimeout(fn, 1200);
  // Smallest first, so the cheap tabs are ready before the expensive one has
  // finished arriving. Titles is 444 strings and no art at all.
  soon(() => {
    void titles();
    void buddies();
    void sprays();
    void cards();
  });
}
