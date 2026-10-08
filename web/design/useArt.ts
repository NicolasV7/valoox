// The measured colour of a piece of art, as a Preact hook.
//
// Returns null until the pixels are in, and a component spreads it straight
// onto `--art`. Nothing waits for it: the weave renders in the neutral default
// and the colour arrives a frame later, which is the right order — a screen
// that holds back its layout until an image decodes is a screen that flashes.

import { useEffect, useState } from 'preact/hooks';
import { measure } from './measure.ts';

export function useArt(url: string | null | undefined): string | null {
  const [art, setArt] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let live = true;
    void measure(url).then((rgb) => {
      if (live) setArt(rgb);
    });
    return () => {
      live = false;
    };
  }, [url]);

  return art;
}

/** What a component puts on the element wearing the weave. */
export const artStyle = (art: string | null) =>
  art ? ({ '--art': art } as unknown as Record<string, string>) : undefined;
