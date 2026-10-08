// What Riot's store can actually draw from.
//
// Starring something the store can never offer is a row that can only
// disappoint, and until this existed there was no way to tell: the content
// tier says how expensive a skin looks, not whether it is sold. Most of the
// battle pass carries one and is never in a shop.
//
// One answer for everybody, cached a day by the Worker and once more here, so
// the search screen filters against a Set it already holds rather than asking
// anything as you type.

import { useEffect, useState } from 'preact/hooks';
import * as api from './api.ts';
import { NEEDS_RESEED } from './api.ts';

let held: Set<string> | null = null;
let asking: Promise<Set<string>> | null = null;

async function load(): Promise<Set<string>> {
  if (held) return held;
  const got = await api.sellable().catch(() => null);
  held = new Set(got && got !== NEEDS_RESEED ? got.ids : []);
  return held;
}

/** Null while it is still coming. A screen that filters on it shows nothing
 *  rather than showing everything: a list that silently includes what cannot
 *  be sold is worse than a list that is briefly empty. */
export function useSells(): Set<string> | null {
  const [set, put] = useState<Set<string> | null>(held);

  useEffect(() => {
    if (held) return;
    asking ??= load();
    let alive = true;
    void asking.then((s) => {
      if (alive) put(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return set;
}
