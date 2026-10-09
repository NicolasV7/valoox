// The Cards tab. Two columns, not three: a card is a 2:5 portrait and at a
// third of the width it stops being a picture.
//
// The tile crops the tall art rather than shrinking it — a card you cannot
// read is not a card — and the wash behind it is still that painting's own
// measured colour, which is what shows at the edges of the crop.

import { useMemo } from 'preact/hooks';
import { Search } from '../components/icons.tsx';
import { More } from '../components/More.tsx';
import type { Card } from '../data/cards.ts';
import { sift as pick } from '../data/find.ts';
import { useKept } from '../data/kept.ts';
import { useMore } from '../data/more.ts';
import type { Inventory } from '../data/types.ts';
import { useCards } from '../data/useIndex.ts';
import { warm } from '../data/warm.ts';
import { t } from '../i18n/index.ts';
import { CardsLoading } from './Cards.loading.tsx';
import { Tile } from './Cards.tile.tsx';
import { CollectionTabs } from './Collection.tabs.tsx';

/** Riot's item type for a player card. */
export const CARD = '3f296c07-64c3-494c-923b-fe692a4fa1bd';

export function Cards({ inv }: { inv: Inventory }) {
  const s = t().cards;
  const all = useCards();
  const [find, setFind] = useKept('cards');
  // The ones that are not yours arrive a window at a time. The ones that are
  // never do: there are tens of them and they are why the tab was opened.
  const [shown, more] = useMore('cards', 10);
  warm();

  const own = useMemo(() => new Set(inv.byType[CARD] ?? []), [inv]);
  const worn = inv.worn?.card ?? null;

  const sorted = useMemo(() => {
    if (!all) return null;
    const mine = all.filter((c) => own.has(c.id));
    return {
      mine: mine.sort(
        (a, b) => Number(b.id === worn) - Number(a.id === worn) || a.name.localeCompare(b.name),
      ),
      rest: all.filter((c) => !own.has(c.id)).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [all, own, worn]);

  if (!all || !sorted) return <CardsLoading />;

  const yours = sift(sorted.mine, find);
  const theirs = sift(sorted.rest, find);

  return (
    <main class="screen coll">
      <CollectionTabs on="cards" said={s.of(sorted.mine.length, all.length)} />

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

      <Shelf said={s.yours} list={yours} worn={worn} mine />
      <Shelf said={s.notYours} shown={shown} list={theirs} worn={worn} />
      {theirs.length > shown && <More when={more} at={shown} />}
      {yours.length === 0 && theirs.length === 0 && <p class="lede wall__none">{s.nothing}</p>}

      <p class="legal coll__note">{s.grid}</p>
    </main>
  );
}

/** By name, against what is already downloaded. */
const sift = (list: Card[], find: string): Card[] => pick(list, find, (x) => x.name);

function Shelf({
  said,
  list,
  shown,
  worn,
  mine,
}: {
  said: string;
  list: Card[];
  shown?: number;
  worn: string | null;
  mine?: boolean;
}) {
  if (list.length === 0) return null;
  return (
    <>
      <div class="wall__band">
        <h2 class="label">{said}</h2>
        <span class="faint num">{list.length}</span>
      </div>
      <div class={mine ? 'leaves' : 'leaves wall--theirs'}>
        {(shown ? list.slice(0, shown) : list).map((card) => (
          <Tile key={card.id} card={card} on={card.id === worn} mine={!!mine} />
        ))}
      </div>
    </>
  );
}
