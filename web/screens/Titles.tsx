// The Titles tab. The one tab with no art in it.
//
// A title is a string the game prints next to your name — 444 of them and not
// one picture between them. So it gets type, the pennant the game draws it in,
// and the only grey ramp in the app. Inventing a colour here would be
// inventing data, which is the one thing this interface does not do.
//
// A list rather than a grid, because what is being compared is words.

import { useMemo } from 'preact/hooks';
import { Search, TitleMark } from '../components/icons.tsx';
import { More } from '../components/More.tsx';
import { StarMark } from '../components/StarMark.tsx';
import { sift as pick } from '../data/find.ts';
import { useKept } from '../data/kept.ts';
import { useMore } from '../data/more.ts';
import type { Title } from '../data/titles.ts';
import type { Inventory } from '../data/types.ts';
import { useTitles } from '../data/useIndex.ts';
import { warm } from '../data/warm.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';
import { CollectionTabs } from './Collection.tabs.tsx';
import { TitlesLoading } from './Titles.loading.tsx';

/** Riot's item type for a player title. */
export const TITLE = 'de7caa6b-adf7-4588-bbd1-143831e786c6';

export function Titles({ inv }: { inv: Inventory }) {
  const s = t().titles;
  const all = useTitles();
  const [find, setFind] = useKept('titles');
  // The ones that are not yours arrive a window at a time. The ones that are
  // never do: there are tens of them and they are why the tab was opened.
  const [shown, more] = useMore('titles', 10);
  warm();

  const own = useMemo(() => new Set(inv.byType[TITLE] ?? []), [inv]);
  const worn = inv.worn?.title ?? null;

  const sorted = useMemo(() => {
    if (!all) return null;
    const mine = all.filter((x) => own.has(x.id));
    return {
      mine: mine.sort(
        (a, b) => Number(b.id === worn) - Number(a.id === worn) || a.name.localeCompare(b.name),
      ),
      rest: all.filter((x) => !own.has(x.id)).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [all, own, worn]);

  if (!all || !sorted) return <TitlesLoading />;

  const yours = sift(sorted.mine, find);
  const theirs = sift(sorted.rest, find);

  return (
    <main class="screen coll">
      <CollectionTabs on="titles" said={s.of(sorted.mine.length, all.length)} />

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

      <p class="legal coll__note">{s.noArt}</p>
    </main>
  );
}

/** By the string itself, which is all a title has. */
const sift = (list: Title[], find: string): Title[] => pick(list, find, (x) => x.name);

function Shelf({
  said,
  list,
  shown,
  worn,
  mine,
}: {
  said: string;
  list: Title[];
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
      <div class={mine ? 'said' : 'said wall--theirs'}>
        {(shown ? list.slice(0, shown) : list).map((title) => (
          <Row key={title.id} title={title} worn={title.id === worn} mine={!!mine} />
        ))}
      </div>
    </>
  );
}

function Row({ title, worn, mine }: { title: Title; worn: boolean; mine: boolean }) {
  const route = { name: 'title', id: title.id } as const;
  return (
    <div class="said__row">
      <a class="hit" href={href(route)} onClick={intercept(route)}>
        <span class="sr">{title.name}</span>
      </a>
      <TitleMark size={24} />
      <span class="said__text">{title.name}</span>
      {worn && <span class="said__on">{t().common.equipped}</span>}
      {/* A thing you do not own is a thing the store can still offer
          you, which is why this is a control and not a mark. */}
      {!mine && (
        <StarMark
          size={16}
          item={{ id: title.id, name: title.name, type: 'de7caa6b-adf7-4588-bbd1-143831e786c6' }}
        />
      )}
    </div>
  );
}
