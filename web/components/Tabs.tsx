// The bar at the bottom. Fixed, because the store is a long scroll and the way
// out of it should not require reaching the end.
//
// The two that do not exist yet are drawn disabled rather than hidden or
// silently inert. A control that looks live and does nothing is the worst of
// the three; a missing tab would hide the shape of the app from somebody
// deciding whether it is worth signing into.

import { t } from '../i18n/index.ts';
import { go, type Route, section, useRoute } from '../route.ts';

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
      {[nav.alerts, nav.account].map((label) => (
        <button type="button" class="tab" key={label} disabled aria-disabled="true">
          {label}
        </button>
      ))}
    </nav>
  );
}
