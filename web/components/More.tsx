// The foot of a windowed list: a mark that asks for the next window when it
// comes near the bottom of the screen.
//
// An IntersectionObserver rather than a scroll listener, because a scroll
// listener on a forty-thousand-pixel wall runs on every frame of a flick and
// this runs twice per window. 600px of margin means the next dozen are built
// before the gap where they go is on screen, so scrolling never stops at an
// edge.
//
// The observer is rebuilt on each growth on purpose: a fresh one fires at once
// if the mark is still inside the margin, which is what fills a tall screen in
// one go. Without that it would stall, because a mark that never left the
// margin never crosses it again.

import { useEffect, useRef } from 'preact/hooks';

export function More({ when, at }: { when: () => void; at: number }) {
  const mark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mark.current;
    if (!el || !('IntersectionObserver' in window)) {
      // No observer is no reason to bury the rest of the list: ask once, so
      // the window still grows a step at a time as the component remounts.
      when();
      return;
    }
    const eye = new IntersectionObserver(
      (rows) => {
        if (rows.some((row) => row.isIntersecting)) when();
      },
      { rootMargin: '600px' },
    );
    eye.observe(el);
    return () => eye.disconnect();
  }, [when, at]);

  return <div class="more" ref={mark} />;
}
