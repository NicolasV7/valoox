// The Buddies tab. The spray grid, reused outright: a charm is square too, so
// it borrows that shape rather than earning a second one.
//
// What differs is the line underneath. A spray sits in a slot on a wheel; a
// charm hangs off a weapon, so it names the gun carrying it. And Riot bills
// charms by instance — four copies of one charm are four ids on four guns — so
// the heading counts instances while the grid shows charms, which is why the
// heading is the larger number.

import { useMemo } from 'preact/hooks';
import { Search } from '../components/icons.tsx';
import { More } from '../components/More.tsx';
import type { Buddy } from '../data/buddies.ts';
import { useKept } from '../data/kept.ts';
import { useMore } from '../data/more.ts';
import type { Inventory } from '../data/types.ts';
import { useGuns } from '../data/useGuns.ts';
import { useBuddies } from '../data/useIndex.ts';
import { warm } from '../data/warm.ts';
import { t } from '../i18n/index.ts';
import { BuddiesLoading } from './Buddies.loading.tsx';
import { Tile } from './Buddies.tile.tsx';
import { CollectionTabs } from './Collection.tabs.tsx';

/** Riot's item type for a charm. The ids under it are levels, not charms. */
export const BUDDY = 'dd3bf334-87f3-40bd-b043-682a57a8dc3a';

export function Buddies({ inv }: { inv: Inventory }) {
  const s = t().buddies;
  const all = useBuddies();
  const [find, setFind] = useKept('buddies');
  // The ones that are not yours arrive a window at a time. The ones that are
  // never do: there are tens of them and they are why the tab was opened.
  const [shown, more] = useMore('buddies', 12);
  warm();

  // Two different numbers out of one list. Riot sends one entry per instance
  // and an instance is identified by its charm's level, so four copies of one
  // charm are the same uuid four times: the length is instances, the set is
  // charms. Measured on the live account — 34 entries, 18 distinct.
  const held = inv.byType[BUDDY] ?? [];
  const own = useMemo(() => new Set(held), [inv]);
  // Which gun is carrying which charm, by the charm's level uuid — that is
  // what the loadout speaks in, and what the entitlements do too.
  const hung = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const [gun, on] of Object.entries(inv.worn?.guns ?? {})) {
      if (!on.buddy) continue;
      const already = out[on.buddy] ?? [];
      already.push(gun);
      out[on.buddy] = already;
    }
    return out;
  }, [inv]);

  // Only the handful of guns actually carrying one, resolved one at a time:
  // the weapons index is 430 KB and this tab does not otherwise need it.
  const guns = useGuns(Object.values(hung).flat());

  const sorted = useMemo(() => {
    if (!all) return null;
    const mine = (b: Buddy) => b.levels.some((l) => own.has(l));
    const on = (b: Buddy) => b.levels.some((l) => hung[l]);
    return {
      mine: all
        .filter(mine)
        .sort((a, b) => Number(on(b)) - Number(on(a)) || a.name.localeCompare(b.name)),
      rest: all.filter((b) => !mine(b)).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [all, own, hung]);

  if (!all || !sorted) return <BuddiesLoading />;

  const yours = sift(sorted.mine, find);
  const theirs = sift(sorted.rest, find);
  const carried = (b: Buddy) => b.levels.flatMap((l) => hung[l] ?? []).map((g) => guns[g] ?? '');

  return (
    <main class="screen coll">
      <CollectionTabs on="buddies" said={s.of(held.length, all.length)} />

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

      <Shelf said={s.yours} list={yours} on={carried} mine />
      <Shelf said={s.notYours} shown={shown} list={theirs} on={carried} />
      {theirs.length > shown && <More when={more} at={shown} />}
      {yours.length === 0 && theirs.length === 0 && <p class="lede wall__none">{s.nothing}</p>}

      <p class="legal coll__note">{s.grid}</p>
      <p class="legal coll__note coll__note--next">
        {s.instances(held.length, sorted.mine.length)}
      </p>
    </main>
  );
}

/** By name, against what is already downloaded. */
function sift(list: Buddy[], find: string): Buddy[] {
  const hunt = find.trim().toLowerCase();
  if (!hunt) return list;
  return list.filter((b) => b.name.toLowerCase().includes(hunt));
}

function Shelf({
  said,
  list,
  shown,
  on,
  mine,
}: {
  said: string;
  list: Buddy[];
  shown?: number;
  on: (b: Buddy) => string[];
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
        {(shown ? list.slice(0, shown) : list).map((buddy) => (
          <Tile key={buddy.id} buddy={buddy} on={on(buddy)} mine={!!mine} />
        ))}
      </div>
    </>
  );
}
