// The bar at the bottom. Fixed, because the store is a long scroll and the way
// out of it should not require reaching the end.
//
// All four exist now. The last of them was drawn disabled for a while rather
// than hidden, on the reasoning that a missing tab hides the shape of the app
// from somebody deciding whether it is worth signing into — which is the same
// reason it was drawn at all.

import { section } from '../belong.ts';
import { t } from '../i18n/index.ts';
import { go, type Route, useRoute } from '../route.ts';

/** Which tab a screen belongs to. The offer and the bundle are reached from
 *  the store, a weapon from the collection — the bar marks where you are, not
 *  which URL you are on. */
export function Tabs() {
  const route = useRoute();
  const nav = t().common.nav;
  const here = section(route.name);

  const open = (to: Route, label: string, key: string) => (
    <button
      type="button"
      class="tab"
      key={key}
      aria-current={here === key ? 'page' : undefined}
      onClick={() => go(to)}
    >
      {label}
    </button>
  );

  return (
    <nav class="tabs">
      {open({ name: 'store' }, nav.store, 'store')}
      {open({ name: 'collection', tab: 'weapons' }, nav.collection, 'collection')}
      {open({ name: 'alerts' }, nav.alerts, 'alerts')}
      {open({ name: 'account' }, nav.account, 'account')}
    </nav>
  );
}
