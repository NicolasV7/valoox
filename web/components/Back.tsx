// The way out of a screen.
//
// Two things it has to get right, and the old history.back() got neither.
//
// A /weapon/<uuid> opened cold — a link from a message, or a reload — has
// somebody else's page behind it, and history.length is almost always above 1
// in a real tab, so a pop walked out of the app. And the label lied: a skin
// reached from a weapon is /offer/<level>, whose back link read "Store" and
// landed on the weapon.
//
// So it is a link to a route. Which route is the screen you came from when the
// screen you came from said so — that is `whence`, and it rides in the history
// entry, so it survives a reload and comes back with the entry on a swipe —
// and otherwise the section this screen belongs to. Either way the word on it
// is the name of the place it goes, which is the whole point.

import { t } from '../i18n/index.ts';
import { href, type Route, retreat, whence } from '../route.ts';
import { Chevron } from './icons.tsx';

export function Back({ to }: { to: Route }) {
  const from = whence();
  const there = from?.to ?? to;

  return (
    <a class="back" href={href(there)} onClick={retreat(there)}>
      <span class="back__chev">
        <Chevron />
      </span>
      {from?.said ?? said(to)}
    </a>
  );
}

/** What a section is called, for the screens that were opened straight into. */
function said(to: Route): string {
  const s = t();
  if (to.name !== 'collection') return s.common.nav.store;
  return to.tab === 'weapons' ? s.collection.title : s.collection.tab[to.tab];
}

/** The sections a back control falls back to, named once so a screen declares
 *  where it belongs rather than spelling out a route. */
export const STORE: Route = { name: 'store' };
export const COLLECTION: Route = { name: 'collection', tab: 'weapons' };
export const SPRAYS: Route = { name: 'collection', tab: 'sprays' };
