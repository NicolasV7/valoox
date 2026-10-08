// How much of a long list is on screen.
//
// The ones you own are drawn whole — there are tens of them and they are the
// reason you opened the tab. The ones you do not are nine hundred, and a phone
// mounting nine hundred cells before it can show you fourteen is the whole of
// the wait. So they arrive a window at a time: a dozen, then more as the foot
// of the list comes near, and the search runs over all of them regardless, so
// looking for one buried at eight hundred still finds it.
//
// Kept for the life of the page, like the search text, and for a sharper
// reason than convenience: route.ts puts the scroll position back when you
// come away from a detail, and a window that reset to a dozen would leave
// nothing for that position to land on.

import { useCallback, useRef, useState } from 'preact/hooks';

const grown = new Map<string, number>();

/** The count on screen, and a way to ask for one more window of them. */
export function useMore(key: string, step: number): [number, () => void] {
  const [shown, set] = useState(() => grown.get(key) ?? step);
  // The observer's callback has to be stable or it re-subscribes on every
  // render, so the current count is read through a ref rather than closed over.
  const now = useRef(shown);
  now.current = shown;

  const more = useCallback(() => {
    const next = now.current + step;
    grown.set(key, next);
    set(next);
  }, [key, step]);

  return [shown, more];
}
