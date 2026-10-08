// Titles, waiting on the catalogue. Six rows at their final height.

import { t } from '../i18n/index.ts';
import { CollectionTabs } from './Collection.tabs.tsx';

const ROWS = [0, 1, 2, 3, 4, 5];

export function TitlesLoading() {
  return (
    <main class="screen coll">
      <CollectionTabs on="titles" />

      <div class="said">
        {ROWS.map((row) => (
          <div class="said__row said__row--waiting" key={row}>
            <span class="skel said__mark--waiting" />
            <span class="skel said__text--waiting" />
          </div>
        ))}
      </div>

      <p class="legal coll__note">{t().titles.waitingWhy}</p>
    </main>
  );
}
