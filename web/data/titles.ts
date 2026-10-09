// The player titles index: every title the game has.
//
// The one catalogue with no artwork in it. A title is a string the game prints
// next to your name, and `titleText` is that string — `displayName` is the
// catalogue entry for it ("Fortune Title"), which is a different thing and not
// what anybody wears. Measured: 443 of the 444 carry a titleText.

import { keepHidden } from './sellable.ts';

const V1 = 'https://valorant-api.com/v1/';

export interface Title {
  id: string;
  /** What the game prints. */
  name: string;
}

interface Raw {
  uuid: string;
  displayName: string | null;
  titleText: string | null;
  /** Riot's mark for a thing that is awarded rather than offered. See
   *  data/sellable.ts. */
  isHiddenIfNotOwned?: boolean;
}

const KIND = / Title$/;

let held: Promise<Title[]> | null = null;

/** Every title, in Riot's own order. Never rejects. */
export function titles(): Promise<Title[]> {
  held ??= fetch(V1 + 'playertitles')
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { data?: Raw[] } | null) =>
      (j?.data ?? [])
        .map((t) => {
          if (t.isHiddenIfNotOwned) keepHidden(t.uuid);
          return {
            id: t.uuid,
            name: t.titleText?.trim() || t.displayName?.trim().replace(KIND, '') || '',
          };
        })
        // One entry is PlayerTitle_Default, Riot's "no title equipped", and it
        // carries neither field — the same shape as the spray they publish
        // under the name None. It is not a title you can have, and reading it
        // as one took the whole index down with a TypeError the catch below
        // then swallowed into an empty tab.
        .filter((t) => t.name !== ''),
    )
    .catch(() => []);
  return held;
}
