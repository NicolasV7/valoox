// A uuid becomes a name and a picture, as a hook.
//
// One request per item rather than an index: the store shows eight or nine
// things and the weapons index alone is 3.5 MB. catalogue.ts remembers every
// answer for the life of the page, so a skin that appears in the daily store
// and again inside a bundle is fetched once.

import { useEffect, useState } from 'preact/hooks';
import { type Piece, piece, skin } from './catalogue.ts';

function resolve(get: () => Promise<Piece | null>, key: string): Piece | null {
  const [found, setFound] = useState<Piece | null>(null);

  useEffect(() => {
    let live = true;
    void get().then((p) => {
      if (live) setFound(p);
    });
    return () => {
      live = false;
    };
    // `key` is the identity: the getter is a fresh closure every render.
  }, [key]);

  return found;
}

/** The daily store and the night market are always weapon skins. */
export const useSkin = (id: string) => resolve(() => skin(id), id);

/** A bundle's contents and the accessory store are mixed types. */
export const usePiece = (type: string, id: string) => resolve(() => piece(type, id), type + id);
