// The weapon you carry, at the top of its own screen.
//
// Its own file because it is the one thing on here that is about a single
// skin rather than about the list — and because the list was at the line
// limit, which is the signal that two jobs were sharing a file.

import { Chevron } from '../components/icons.tsx';
import { type Weapon as Gun, type Skin, shortName } from '../data/skins.ts';
import { tierOf } from '../data/tiers.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

/** The one you carry, and the way into its own screen. */
export function Worn({
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
  const route = { name: 'skin', id: on?.level ?? skin.levels[0]?.id ?? '' } as const;

  // Each part only when it is a choice: "Level 1" on a skin with one level
  // answers a question nobody could have had, and so does its one colourway.
  const says = [
    tier ? t().common.tier[tier.name] : null,
    skin.levels.length > 1 ? t().offer.levelNo(level + 1) : null,
    skin.chromas.length > 1 ? (chroma?.colour ?? t().offer.original) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // The standard skin opens on nothing: no tier, no levels, no colourways and
  // no price, because it is not a thing that was ever sold. A slot wearing it
  // is the same box without the link, rather than a link to an empty screen.
  const Wrap = tier ? 'a' : 'div';
  const open = tier
    ? {
        href: href(route),
        onClick: intercept(route, { to: { name: 'weapon', id: gun.id }, said: gun.name }),
      }
    : {};

  return (
    <Wrap class={tier ? 'worn stage' : 'worn worn--bare stage'} style={artStyle(lit)} {...open}>
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
        {tier && (
          <span class="worn__chev">
            <Chevron size={16} />
          </span>
        )}
      </span>
    </Wrap>
  );
}
