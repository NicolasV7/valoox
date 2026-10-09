// The weapons tab with its content removed, measured against it: same group
// headings in the same places, same 104px slots two up, the melee slot at 118.
//
// The tab strip is already real because it needs no data — only the equipped
// count and the guns are waiting on Riot, so only those two are holes.
//
// The slot counts are not a guess either. They are the game's own racks, and
// the index that supplies them is the same one the real screen draws from, so
// the skeleton and the thing it stands in for cannot drift apart.

import { CollectionTabs } from './Collection.tabs.tsx';

/** Sidearms, SMGs, Shotguns, Rifles, Snipers, Heavies — slots and the width of
 *  the word over them, both off the board. The melee rack is drawn separately
 *  because its one slot is a different height. */
const RACKS: Array<[slots: number, label: string]> = [
  [6, '94px'],
  [2, '74px'],
  [2, '94px'],
  [5, '84px'],
  [3, '89px'],
  [2, '89px'],
];

export function CollectionLoading() {
  return (
    <main class="screen coll">
      <CollectionTabs on="weapons" />

      {RACKS.map(([slots, label], rack) => (
        <section class="coll__rack" key={rack}>
          <span class="skel label--waiting" style={{ width: label }} />
          <div class="slots">
            {Array.from({ length: slots }, (_, slot) => (
              <div class="slot slot--waiting" key={slot} />
            ))}
          </div>
        </section>
      ))}

      <section class="coll__rack">
        <span class="skel label--waiting" style={{ width: '62px' }} />
        <div class="slots slots--one">
          <div class="slot slot--waiting slot--big" />
        </div>
      </section>
    </main>
  );
}
