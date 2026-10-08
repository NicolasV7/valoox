// The bar at the bottom. Fixed, because the store is a long scroll and the way
// out of it should not require reaching the end.
//
// Three of the four do not exist yet, and they are drawn disabled rather than
// hidden or silently inert. A control that looks live and does nothing is the
// worst of the three; a missing tab would hide the shape of the app from
// somebody deciding whether it is worth signing into.

import { t } from '../i18n/index.ts';
import { go, useRoute } from '../route.ts';

export function Tabs() {
  const route = useRoute();
  const nav = t().common.nav;
  const soon = [nav.collection, nav.alerts, nav.account];

  return (
    <nav class="tabs">
      <button
        type="button"
        class="tab"
        aria-current={route.name === 'store' ? 'page' : undefined}
        onClick={() => go({ name: 'store' })}
      >
        {nav.store}
      </button>
      {soon.map((label) => (
        <button type="button" class="tab" key={label} disabled aria-disabled="true">
          {label}
        </button>
      ))}
    </nav>
  );
}
