// The way out of a screen.
//
// It goes to the place written on it rather than into the browser's history.
// That is not a style choice: a link opened from a message has somebody else's
// page behind it, and history.back() there walks out of the app — which is
// exactly what happened on a /weapon/<uuid> opened cold. It also makes the
// label true, which it was not: a skin opened from a weapon said "Store" and
// landed on the weapon.
//
// The boards agree. Every one of them draws this control as a link that names
// a screen and points at that screen.
//
// The swipe still retraces your steps. This is the other thing — the way up
// rather than the way back — and the two only look alike because most of the
// time you came from the place above.

import { t } from '../i18n/index.ts';
import { href, intercept, type Route } from '../route.ts';
import { Chevron } from './icons.tsx';

export function Back({ to }: { to: Route }) {
  return (
    <a class="back" href={href(to)} onClick={intercept(to)}>
      <span class="back__chev">
        <Chevron />
      </span>
      {said(to)}
    </a>
  );
}

/** What that place is called. Only the two sections are ever a destination, so
 *  anything else is the store — the screen every piece with a price sits
 *  under. */
function said(to: Route): string {
  const s = t();
  if (to.name !== 'collection') return s.common.nav.store;
  return to.tab === 'weapons' ? s.collection.title : s.collection.tab[to.tab];
}

/** The two places a back control can point at, named once so a screen declares
 *  where it belongs rather than spelling out a route. */
export const STORE: Route = { name: 'store' };
export const COLLECTION: Route = { name: 'collection', tab: 'weapons' };
export const SPRAYS: Route = { name: 'collection', tab: 'sprays' };
