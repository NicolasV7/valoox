// Buddies, waiting on the catalogue. The sprays skeleton at the charm's height.
//
// The heading's count is a hole for the same reason it is there: the total is a
// number only the catalogue has, and Riot answers with ids that do not say what
// they belong to.

import { t } from '../i18n/index.ts';
import { CollectionTabs } from './Collection.tabs.tsx';

const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function BuddiesLoading() {
  return (
    <main class="screen coll">
      <CollectionTabs on="buddies" />

      <div class="wall">
        {CELLS.map((cell) => (
          <div class="pad pad--tall pad--waiting" key={cell}>
            <span class="skel pad__shot--waiting" />
            <span class="skel pad__name--waiting" />
            <span class="skel pad__slot--waiting" />
          </div>
        ))}
      </div>

      <p class="legal coll__note">{t().buddies.waitingWhy}</p>
    </main>
  );
}
