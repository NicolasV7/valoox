// One skin in the list, on its own measured colour.
//
// Its own file because the colour is a hook: a row has to measure its render
// before it can wear it, and a hook cannot run inside the map that draws the
// list. One component per row is what makes that legal.

import { useState } from 'preact/hooks';
import { Chevron } from '../components/icons.tsx';
import { StarMark } from '../components/StarMark.tsx';
import { type Skin, shortName } from '../data/skins.ts';
import { tierOf } from '../data/tiers.ts';
import { colourOf } from '../design/measure.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

/** Riot's item type for a skin level, which is what the storefront and the
 *  wishlist both speak in. */
const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

export function SkinRow({
  skin,
  gun,
  of,
  mine,
}: {
  skin: Skin;
  gun: string;
  /** The weapon's uuid, so the screen this opens knows its way back here. */
  of: string;
  mine: boolean;
}) {
  const s = t().weapon;
  const art = skin.render;
  // The colour is read off the picture, so it waits for the picture. That is
  // not politeness: measure() opens its own Image, and firing all 174 of them
  // the moment the list mounts is 174 downloads racing the ones the rows are
  // already making. Hanging it off the <img>'s own load hands the scheduling
  // to loading="lazy" — nothing below the fold is fetched or measured at all,
  // and crossOrigin makes both requests the same cache entry instead of two.
  // Already measured means already decoded, so a revisit skips the grey.
  const [shot, setShot] = useState(() => colourOf(art) !== null);
  const lit = useArt(shot ? art : null);
  const tier = tierOf(skin.tier);
  const route = { name: 'skin', id: skin.levels[0]?.id ?? skin.id } as const;
  // A skin opened from here belongs to this weapon, not to the store it is
  // also sold in, so it carries the way back with it.
  const from = { to: { name: 'weapon', id: of } as const, said: gun };

  // Only what is a choice. 857 skins have one level and 880 have no second
  // colourway, so a line that always read "1 level · 1 variant" would be a
  // line that says nothing on most of the list.
  const says = [
    skin.levels.length > 1 ? s.levels(skin.levels.length) : null,
    skin.chromas.length > 1 ? s.variants(skin.chromas.length) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div class="skin stage stage--row" style={artStyle(lit)}>
      <a class="hit" href={href(route)} onClick={intercept(route, from)}>
        <span class="sr">{shortName(skin, gun)}</span>
      </a>
      {art && (
        <img
          class={shot ? 'skin__art skin__art--on' : 'skin__art'}
          src={art}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          onLoad={() => setShot(true)}
        />
      )}
      <span class="skin__id">
        <span class="skin__name">
          <span class="skin__text">{shortName(skin, gun)}</span>
          {/* The one place the tier is not written out, so the icon carries
              the word for anyone not looking at it. */}
          {tier && <img src={tier.icon} alt={t().common.tier[tier.name]} width="13" height="13" />}
        </span>
        {says && <span class="skin__what">{says}</span>}
      </span>
      {/* Where it goes, when it is yours. A star when it is not, which is
          both what tells the two lists apart at the end of a scroll and the
          way to put it on the list. */}
      {mine ? (
        <span class="skin__end skin__end--go">
          <Chevron size={16} />
        </span>
      ) : (
        <span class="skin__end">
          <StarMark
            size={17}
            item={{ id: skin.levels[0]?.id ?? skin.id, name: shortName(skin, gun), type: LEVELS }}
          />
        </span>
      )}
    </div>
  );
}
