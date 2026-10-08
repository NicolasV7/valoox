// Cards, waiting on the catalogue. Six portraits at their final height.

import { t } from '../i18n/index.ts';
import { CollectionTabs } from './Collection.tabs.tsx';

const CELLS = [0, 1, 2, 3, 4, 5];

export function CardsLoading() {
  return (
    <main class="screen coll">
      <CollectionTabs on="cards" />

      <div class="leaves">
        {CELLS.map((cell) => (
          <div class="leaf leaf--waiting" key={cell} />
        ))}
      </div>

      <p class="legal coll__note">{t().cards.waitingWhy}</p>
    </main>
  );
}
