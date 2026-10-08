// One skin in the list, on its own measured colour.
//
// Its own file because the colour is a hook: a row has to measure its render
// before it can wear it, and a hook cannot run inside the map that draws the
// list. One component per row is what makes that legal.

import { Chevron, Star } from '../components/icons.tsx';
import { type Skin, shortName } from '../data/skins.ts';
import { tierOf } from '../data/tiers.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function SkinRow({ skin, gun, mine }: { skin: Skin; gun: string; mine: boolean }) {
  const s = t().weapon;
  const art = skin.render;
  const lit = useArt(art);
  const tier = tierOf(skin.tier);
  const route = { name: 'offer', id: skin.levels[0]?.id ?? skin.id } as const;

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
    <a
      class="skin stage stage--row"
      style={artStyle(lit)}
      href={href(route)}
      onClick={intercept(route)}
    >
      {art && <img class="skin__art" src={art} alt="" loading="lazy" />}
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
          what tells the two lists apart at the end of a scroll. It is a mark
          and not a control until the wishlist exists to put it on. */}
      <span class={mine ? 'skin__end skin__end--go' : 'skin__end'}>
        {mine ? <Chevron size={16} /> : <Star size={17} />}
      </span>
    </a>
  );
}
