// One slot, opened: every skin the game has for this weapon.
//
// The equipped one takes the top, then the others you own, then the ones you
// do not — the gaps are half of what a collection tells you. 105 Vandal skins
// is past the point where scrolling works, so the search comes along; all of
// them are already in the browser, so the list narrows as you type and nothing
// goes back to the Worker for it.
//
// Nothing here is weapon-specific. The Vandal is the board it was drawn from;
// a melee is the same screen with one slot behind it.

import { useMemo } from 'preact/hooks';
import { Back, COLLECTION } from '../components/Back.tsx';
import { Search } from '../components/icons.tsx';
import { sift as pick } from '../data/find.ts';
import { useKept } from '../data/kept.ts';
import type { Skin } from '../data/skins.ts';
import type { Inventory } from '../data/types.ts';
import { useWeapon } from '../data/useIndex.ts';
import { t } from '../i18n/index.ts';
import { Worn } from './Weapon.hero.tsx';
import { WeaponLoading } from './Weapon.loading.tsx';
import { SkinRow } from './Weapon.row.tsx';

/** Riot's item type for a weapon skin. The ids under it are the levels, not the
 *  skins, which is why a skin is matched against both. */
const SKINS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

export function Weapon({ id, inv }: { id: string; inv: Inventory }) {
  const s = t().weapon;
  const gun = useWeapon(id);
  // Keyed by the weapon, so two of them do not share one field.
  const [find, setFind] = useKept('weapon:' + id);

  const owned = useMemo(() => new Set(inv.byType[SKINS] ?? []), [inv]);
  const on = inv.worn?.guns[id];

  const sorted = useMemo(() => {
    if (!gun) return null;
    const mine = (k: Skin) => owned.has(k.id) || k.levels.some((l) => owned.has(l.id));
    const worn = gun.skins.find((k) => k.levels.some((l) => l.id === on?.level));
    // The default skin is in here too and it is not a thing you can want or
    // not want, so the tier filter drops it: it is the only one with none.
    const rest = gun.skins.filter((k) => k !== worn && k.tier);
    return { worn, yours: rest.filter(mine), theirs: rest.filter((k) => !mine(k)) };
  }, [gun, owned, on]);

  if (!gun || !sorted) return <WeaponLoading />;

  const all = gun.skins.filter((k) => k.tier).length;
  const have = sorted.yours.length + (sorted.worn?.tier ? 1 : 0);
  const yours = sift(sorted.yours, find);
  const theirs = sift(sorted.theirs, find);

  return (
    <main class="screen gun">
      <Back to={COLLECTION} />

      <div class="gun__id">
        <h1>{gun.name}</h1>
        <span class="gun__count num">{s.of(have, all)}</span>
      </div>

      {sorted.worn && <Worn gun={gun} skin={sorted.worn} on={on} />}

      <div class="find">
        <span class="find__glass">
          <Search />
        </span>
        <input
          type="search"
          value={find}
          placeholder={s.search(all, gun.name)}
          aria-label={s.search(all, gun.name)}
          onInput={(e) => setFind((e.currentTarget as HTMLInputElement).value)}
        />
      </div>
      <p class="legal gun__note">{s.searchWhy(all)}</p>

      <Shelf said={s.alsoYours} list={yours} gun={gun.name} of={gun.id} mine />
      <Shelf said={s.notYours} list={theirs} gun={gun.name} of={gun.id} />
      {yours.length === 0 && theirs.length === 0 && <p class="lede gun__none">{s.nothing}</p>}

      <p class="legal gun__note">{s.weave}</p>
    </main>
  );
}

/** Name or tier, against what is already downloaded. The theme is in the name
 *  on all but a handful — "Reaver Vandal" is the Reaver theme — so this is one
 *  pass over an array rather than a second index holding the themes. */
const sift = (list: Skin[], find: string): Skin[] => pick(list, find, (x) => x.name);

function Shelf({
  said,
  list,
  gun,
  of,
  mine,
}: {
  said: string;
  list: Skin[];
  gun: string;
  of: string;
  mine?: boolean;
}) {
  if (list.length === 0) return null;
  return (
    <>
      <div class="gun__head">
        <h2 class="label">{said}</h2>
        <span class="faint num">{list.length}</span>
      </div>
      <div class={mine ? 'shelf' : 'shelf shelf--theirs'}>
        {list.map((skin) => (
          <SkinRow key={skin.id} skin={skin} gun={gun} of={of} mine={!!mine} />
        ))}
      </div>
    </>
  );
}
