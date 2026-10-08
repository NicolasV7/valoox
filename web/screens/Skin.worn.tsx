// The block at the foot of the screen: the skin, at the size it is a picture.
//
// It used to be about ownership and would disappear when the answer was no —
// which meant the one screen whose whole job is "what does this look like"
// showed nothing for every skin you have not bought. The picture is the
// point; whether it is yours is a caption on it.
//
// It follows the pickers above it, so choosing a colourway changes the thing
// you are looking at rather than only the clip. That is the difference
// between a list of swatches and a way to see a knife in red.
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
  level,
  colour,
}: {
  skin: Skin;
  weapon: Weapon;
  inv: Inventory;
  mine: boolean;
  melee: boolean;
  art: string | null;
  /** The level uuid the pickers are on. */
  level: string;
  /** The colourway they are on, or null for the skin as it ships. */
  colour: string | null;
}) {
  const s = t().skin;
  const on = inv.worn?.guns[weapon.id];
  // Which level of THIS skin is equipped, if any. -1 means something else is.
  const step = skin.levels.findIndex((l) => l.id === on?.level);
  const here = step >= 0;

  // What the pickers are showing. A colourway carries its own render; a level
  // carries an icon; the skin's own render is the floor, and 47 skins in the
  // catalogue have nothing else.
  const chosen = skin.chromas.find((c) => c.id === colour);
  const at = skin.levels.findIndex((l) => l.id === level);
  const art2 = chosen?.render ?? skin.levels[at]?.icon ?? skin.render;

  // Which skin is holding the slot instead, for the middle state.
  const other = here ? null : weapon.skins.find((k) => k.levels.some((l) => l.id === on?.level));

  return (
    <>
      <div class="vary__band">
        <h2 class="label">{here ? s.equippedNow : mine ? s.yoursNotOn : s.howItLooks}</h2>
      </div>
      <div class={melee ? 'slab slab--tall stage' : 'slab stage'} style={artStyle(art)}>
        {art2 && <img class="slab__art" src={art2} alt="" />}
      </div>
      <p class="legal vary__under">{said()}</p>
    </>
  );

  function said(): string {
    // The equipped line reports the loadout, which is a fact about the gun
    // and not about what is on screen — so it only speaks when the pickers
    // are showing the thing that is actually on.
    if (here && level === on?.level && (colour ?? null) === (on?.chroma ?? null)) {
      const worn = skin.chromas.find((c) => c.id === on?.chroma);
      return s.readOff(t().offer.levelNo(step + 1), worn?.colour ?? t().offer.original);
    }
    if (here) return s.alsoOn(t().offer.levelNo(step + 1));
    if (mine) return s.holds(line(other?.name, weapon.name));
    return s.notYoursPreview;
  }
}

/** The other skin's name without the weapon on the end of it, and the standard
 *  skin's own word when that is what is on. */
function line(name: string | undefined, weapon: string): string {
  if (!name) return t().collection.standard;
  const cut = name.lastIndexOf(' ' + weapon);
  return cut > 0 ? name.slice(0, cut) : name;
}
