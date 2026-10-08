// The Sprays tab. Square art, so a grid; each tile washed in its own colour.
//
// All 921, split the way the skin list splits: the ones on your wheel first,
// then the rest of yours, then the ones that are not. A collection is as much
// about the gaps as about what fills them, and with nine hundred of them on
// the other side of that line the search is not a convenience.
//
// Everything here is already in the browser — one index, fetched once — so the
// list narrows as you type and nothing goes back to the Worker for it.

import { useMemo } from 'preact/hooks';
import { Search } from '../components/icons.tsx';
import { useKept } from '../data/kept.ts';
import type { Spray } from '../data/sprays.ts';
import type { Inventory } from '../data/types.ts';
import { useSprays } from '../data/useIndex.ts';
import { warm } from '../data/warm.ts';
import { t } from '../i18n/index.ts';
import { CollectionTabs } from './Collection.tabs.tsx';
import { SpraysLoading } from './Sprays.loading.tsx';
import { Tile } from './Sprays.tile.tsx';

/** Riot's item type for a spray. */
export const SPRAY = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475';

export function Sprays({ inv }: { inv: Inventory }) {
  const s = t().sprays;
  const all = useSprays();
  const [find, setFind] = useKept('sprays');
  warm();

  const own = useMemo(() => new Set(inv.byType[SPRAY] ?? []), [inv]);
  const wheel = inv.worn?.sprays ?? [];

  const sorted = useMemo(() => {
    if (!all) return null;
    // Where it sits on the wheel, and everything else after the wheel ends.
    const at = (id: string) => {
      const on = wheel.indexOf(id);
      return on < 0 ? wheel.length : on;
    };
    const mine = all
      .filter((x) => own.has(x.id))
      .sort((a, b) => at(a.id) - at(b.id) || a.name.localeCompare(b.name));
    // Riot's own order is the order they shipped them, which is no order at
    // all at nine hundred. Sorted once here rather than on every keystroke.
    const rest = all.filter((x) => !own.has(x.id)).sort((a, b) => a.name.localeCompare(b.name));
    return { mine, rest };
  }, [all, own, wheel]);

  if (!all || !sorted) return <SpraysLoading />;

  const yours = sift(sorted.mine, find);
  const theirs = sift(sorted.rest, find);
  const on = sorted.mine.filter((x) => wheel.includes(x.id)).length;

  return (
    <main class="screen coll">
      <CollectionTabs on="sprays" said={s.of(sorted.mine.length, all.length)} />

      <div class="find wall__find">
        <span class="find__glass">
          <Search />
        </span>
        <input
          type="search"
          value={find}
          placeholder={s.search(all.length)}
          aria-label={s.search(all.length)}
          onInput={(e) => setFind((e.currentTarget as HTMLInputElement).value)}
        />
      </div>

      <Shelf said={s.yours} list={yours} wheel={wheel} mine />
      <Shelf said={s.notYours} list={theirs} wheel={wheel} />
      {yours.length === 0 && theirs.length === 0 && <p class="lede wall__none">{s.nothing}</p>}

      <p class="legal coll__note">{s.grid}</p>
      <p class="legal coll__note coll__note--next">{s.wheel(on, sorted.mine.length - on)}</p>
    </main>
  );
}

/** By name, against what is already downloaded. */
function sift(list: Spray[], find: string): Spray[] {
  const hunt = find.trim().toLowerCase();
  if (!hunt) return list;
  return list.filter((x) => x.name.toLowerCase().includes(hunt));
}

function Shelf({
  said,
  list,
  wheel,
  mine,
}: {
  said: string;
  list: Spray[];
  wheel: string[];
  mine?: boolean;
}) {
  if (list.length === 0) return null;
  return (
    <>
      <div class="wall__band">
        <h2 class="label">{said}</h2>
        <span class="faint num">{list.length}</span>
      </div>
      <div class={mine ? 'wall' : 'wall wall--theirs'}>
        {list.map((spray) => (
          <Tile key={spray.id} spray={spray} slot={wheel.indexOf(spray.id) + 1} mine={!!mine} />
        ))}
      </div>
    </>
  );
}
