// Sprays, waiting on the catalogue.
//
// The tab strip is real because it needs no data. The heading's count is not:
// the total is a number only the catalogue has, and how many of them are yours
// needs the catalogue too, because Riot answers with ids and an id does not
// say whether it is a spray we can name.
//
// Nine cells, which is three rows at this width — enough that the shape of the
// wall is obvious and not so many that the screen is a grey field.

import { t } from '../i18n/index.ts';
import { CollectionTabs } from './Collection.tabs.tsx';

const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function SpraysLoading() {
  return (
    <main class="screen coll">
      <CollectionTabs on="sprays" />

      <div class="wall">
        {CELLS.map((cell) => (
          <div class="pad pad--waiting" key={cell}>
            <span class="skel pad__shot--waiting" />
            <span class="skel pad__name--waiting" />
            <span class="skel pad__slot--waiting" />
          </div>
        ))}
      </div>

      <p class="legal coll__note">{t().sprays.waitingWhy}</p>
    </main>
  );
}
