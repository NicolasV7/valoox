// What a screen was in the middle of, kept for the life of the page.
//
// Typing four letters into a search, opening one of the results and coming
// back to an empty field is the kind of friction nobody reports and everybody
// feels. The scroll position is already kept in the history entry — see
// route.ts — but that only survives a pop, and the search has to survive the
// tab bar too: leave Sprays, come back to Sprays, the filter is still there.
//
// A module map rather than the history entry, because this is per screen and
// not per entry. It is not persisted anywhere: a reload is a fresh start, and
// a field that outlives the page is a field you did not ask to come back.

import { useState } from 'preact/hooks';

const kept = new Map<string, string>();

/** A text field whose value outlives the screen. The key names the screen, so
 *  two weapons do not share one. */
export function useKept(key: string): [string, (next: string) => void] {
  const [value, set] = useState(() => kept.get(key) ?? '');
  return [
    value,
    (next: string) => {
      kept.set(key, next);
      set(next);
    },
  ];
}
