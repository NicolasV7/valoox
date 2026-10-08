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

import { useMemo, useState } from 'preact/hooks';
import { Back, COLLECTION } from '../components/Back.tsx';
import { Chevron, Search } from '../components/icons.tsx';
import { type Weapon as Gun, type Skin, shortName } from '../data/skins.ts';
import { tierOf } from '../data/tiers.ts';
import type { Inventory } from '../data/types.ts';
import { useWeapon } from '../data/useIndex.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { WeaponLoading } from './Weapon.loading.tsx';
import { SkinRow } from './Weapon.row.tsx';

/** Riot's item type for a weapon skin. The ids under it are the levels, not the
 *  skins, which is why a skin is matched against both. */
const SKINS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

export function Weapon({ id, inv }: { id: string; inv: Inventory }) {
  const s = t().weapon;
  const gun = useWeapon(id);
  const [find, setFind] = useState('');

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

      <Shelf said={s.alsoYours} list={yours} gun={gun.name} mine />
      <Shelf said={s.notYours} list={theirs} gun={gun.name} />
      {yours.length === 0 && theirs.length === 0 && <p class="lede gun__none">{s.nothing}</p>}

      <p class="legal gun__note">{s.weave}</p>
    </main>
  );
}

/** Name or tier, against what is already downloaded. The theme is in the name
 *  on all but a handful — "Reaver Vandal" is the Reaver theme — so this is one
 *  pass over an array rather than a second index holding the themes. */
function sift(list: Skin[], find: string): Skin[] {
  const hunt = find.trim().toLowerCase();
  if (!hunt) return list;
  const tier = (k: Skin) => {
    const of = tierOf(k.tier);
    return of ? t().common.tier[of.name].toLowerCase() : '';
  };
  return list.filter((k) => k.name.toLowerCase().includes(hunt) || tier(k).includes(hunt));
}

function Shelf({
  said,
  list,
  gun,
  mine,
}: {
  said: string;
  list: Skin[];
  gun: string;
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
          <SkinRow key={skin.id} skin={skin} gun={gun} mine={!!mine} />
        ))}
      </div>
    </>
  );
}

/** The one you carry, and the way into its own screen. */
function Worn({
  gun,
  skin,
  on,
}: {
  gun: Gun;
  skin: Skin;
  on?: { level: string; chroma: string | null };
}) {
  const level = Math.max(
    0,
    skin.levels.findIndex((l) => l.id === on?.level),
  );
  const chroma = skin.chromas.find((c) => c.id === on?.chroma);
  const tier = tierOf(skin.tier);
  // A bare slot is the stock gun, which is served from this origin; a dressed
  // one is whatever skin is on, which rotates and stays remote.
  const art = tier
    ? (chroma?.render ?? skin.levels[level]?.icon ?? skin.render)
    : '/art/weapon-' + gun.id + '.png';
  const lit = useArt(tier ? art : null);

  // Each part only when it is a choice: "Level 1" on a skin with one level
  // answers a question nobody could have had, and so does its one colourway.
  const says = [
    tier ? t().common.tier[tier.name] : null,
    skin.levels.length > 1 ? t().offer.levelNo(level + 1) : null,
    skin.chromas.length > 1 ? (chroma?.colour ?? t().offer.original) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <a
      class="worn stage"
      style={artStyle(lit)}
      href={'/offer/' + (on?.level ?? skin.levels[0]?.id)}
    >
      <span class="worn__on">{t().common.equipped}</span>
      {art && <img class="worn__art" src={art} alt="" />}
      <span class="worn__foot">
        <span class="worn__id">
          <span class="worn__name">
            {tier ? shortName(skin, gun.name) : t().collection.standard}
          </span>
          {says && (
            <span class="worn__what">
              {tier && <img src={tier.icon} alt="" width="13" height="13" />}
              {says}
            </span>
          )}
        </span>
        <span class="worn__chev">
          <Chevron size={16} />
        </span>
      </span>
    </a>
  );
}
