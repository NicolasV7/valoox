// The collection's own header: the title, how much of it is dressed, and the
// five tabs.
//
// Shared by all five because it is the thing that does not change between
// them — and because the count has to sit in the same place on every tab or it
// reads as a different screen each time.

import { t } from '../i18n/index.ts';
import { href, intercept, type Tab } from '../route.ts';

const TABS: Tab[] = ['weapons', 'sprays', 'buddies', 'cards', 'titles'];

export function CollectionTabs({ on, said }: { on: Tab; said?: string }) {
  const s = t().collection;

  return (
    <header class="coll__head">
      <div class="coll__title">
        <h1>{s.title}</h1>
        {said ? (
          <span class="faint num coll__count">{said}</span>
        ) : (
          <span class="skel coll__count--waiting" />
        )}
      </div>

      <nav class="coll__tabs">
        {TABS.map((tab) => {
          const route = { name: 'collection', tab } as const;
          return (
            <a
              key={tab}
              class={tab === on ? 'coll__tab coll__tab--on' : 'coll__tab'}
              href={href(route)}
              onClick={intercept(route)}
            >
              {s.tab[tab]}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
