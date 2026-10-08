// Nothing there.
//
// An empty page that looks like an answer is the worst failure available, so
// an empty one says which empty it is: Riot returned nothing, which is unusual
// and probably not true.
//
// And under it, the types Riot did send that this page has no catalogue for.
// Saying so beats silently dropping them from a screen that claims to show
// everything — agents are the usual case, and they are left out on purpose:
// you unlock them by playing rather than collecting, and they crowd out the
// things you actually chose.

import type { Inventory } from '../data/types.ts';
import { kindOf } from '../design/shapes.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';
import { CollectionTabs } from './Collection.tabs.tsx';

export function CollectionEmpty({ inv }: { inv: Inventory }) {
  const s = t().collection;
  const unknown = Object.entries(inv.byType).filter(([type]) => !kindOf(type));
  const items = unknown.reduce((n, [, ids]) => n + ids.length, 0);

  return (
    <main class="screen coll">
      <CollectionTabs on="weapons" said={s.equipped(0, 0)} />

      <div class="nothing">
        <img src={SPRAY.goAgain} alt="" width="92" height="92" />
        <p class="lede">{s.nothing}</p>
        <p class="small faint">{s.nothingWhy}</p>
      </div>

      {unknown.length > 0 && (
        <>
          <h2 class="label coll__also">{s.alsoHere}</h2>
          <div class="card">
            <p class="small">{s.unknown(items, unknown.length)}</p>
            <p class="num coll__types">{unknown.map(([type]) => type).join('\n')}</p>
          </div>
          <p class="legal coll__note">{s.agents}</p>
        </>
      )}
    </main>
  );
}
