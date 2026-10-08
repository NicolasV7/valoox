// The block at the foot of the screen: what this skin is to you right now.
//
// Three states and the third one is nothing. It is on the weapon, or it is
// yours and something else is on the weapon, or it is neither and there is no
// block — a box captioned "you do not have this" is a box about an absence.
//
// There is no Equip button here and there will not be one. Equipping is a PUT
// to the loadout path, and the allowlist carries that path's GET and not its
// PUT — see src/vault/upstream.ts, where the rule says so in its own words.

import type { Skin, Weapon } from '../data/skins.ts';
import type { Inventory } from '../data/types.ts';
import { artStyle } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';

export function Worn({
  skin,
  weapon,
  inv,
  mine,
  melee,
  art,
}: {
  skin: Skin;
  weapon: Weapon;
  inv: Inventory;
  mine: boolean;
  melee: boolean;
  art: string | null;
}) {
  const s = t().skin;
  const on = inv.worn?.guns[weapon.id];
  const step = skin.levels.findIndex((l) => l.id === on?.level);
  const here = step >= 0;

  if (!here && !mine) return null;

  const chroma = here ? skin.chromas.find((c) => c.id === on?.chroma) : null;
  const art2 = here ? (chroma?.render ?? skin.levels[step]?.icon ?? skin.render) : skin.render;

  // Which skin is holding the slot instead, for the second state.
  const other = here ? null : weapon.skins.find((k) => k.levels.some((l) => l.id === on?.level));

  return (
    <>
      <div class="vary__band">
        <h2 class="label">{here ? s.equippedNow : s.yoursNotOn}</h2>
      </div>
      <div class={melee ? 'slab slab--tall stage' : 'slab stage'} style={artStyle(art)}>
        {art2 && <img class="slab__art" src={art2} alt="" />}
      </div>
      <p class="legal vary__under">
        {here
          ? s.readOff(t().offer.levelNo(step + 1), chroma?.colour ?? t().offer.original)
          : s.holds(line(other?.name, weapon.name))}
      </p>
    </>
  );
}

/** The other skin's name without the weapon on the end of it, and the standard
 *  skin's own word when that is what is on. */
function line(name: string | undefined, weapon: string): string {
  if (!name) return t().collection.standard;
  const cut = name.lastIndexOf(' ' + weapon);
  return cut > 0 ? name.slice(0, cut) : name;
}
