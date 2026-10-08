// One offer, opened.
//
// What is here: the render on its own measured colour, the name, the tier and
// the price. What is not here yet: the levels, the variants and Riot's clip.
// Those need the parent skin, and a skin level carries no reference to it — the
// only way up is the 3.5 MB weapons index, which the collection needs anyway
// and which lands with it. The blocks are absent rather than drawn empty,
// because a section that is always "4 of 4" whatever you opened is a section
// that is lying.

import { Chevron } from '../components/icons.tsx';
import { Money } from '../components/Money.tsx';
import { tierByPrice } from '../data/tiers.ts';
import type { StoreView } from '../data/types.ts';
import { useSkin } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';

export function Offer({ id, view }: { id: string; view: StoreView }) {
  const found = useSkin(id);
  const art = useArt(found?.icon);

  // The price is the store's, not the catalogue's — the same skin costs
  // something different in the night market and different again inside a
  // bundle, and whichever one you came in through is the number on screen.
  const { now, was } = priced(view, id);
  const tier = tierByPrice(was ?? now);

  return (
    <main class="screen offer">
      <button type="button" class="back" onClick={back}>
        <span class="offer__chev">
          <Chevron />
        </span>
        {t().common.nav.store}
      </button>

      <div class="offer__stage stage" style={artStyle(art)}>
        {found?.icon && <img class="offer__art" src={found.icon} alt="" />}
      </div>

      <div class="offer__id">
        <h1 class="offer__name">{found?.name ?? t().common.loading}</h1>
        <div class="offer__line">
          {tier && (
            <span class="offer__tier">
              <img src={tier.icon} alt="" width="14" height="14" />
              {t().common.tier[tier.name]}
            </span>
          )}
          <span class="offer__price">
            {was !== null && was !== now && <Money amount={was} struck size={11} />}
            <Money amount={now} size={17} />
          </span>
        </div>
      </div>
    </main>
  );
}

/** What this skin costs, and what it cost before, from whichever of the three
 *  places it was opened from. `was` is null in the daily store, which sells at
 *  one price and never shows a second number. */
function priced(view: StoreView, id: string): { now: number | null; was: number | null } {
  const daily = view.offers.find((o) => o.id === id);
  if (daily) return { now: daily.cost, was: null };

  const night = view.night?.items.find((o) => o.id === id);
  if (night) return { now: night.price ?? night.cost, was: night.cost };

  const packed = view.bundles.flatMap((b) => b.items).find((it) => it.id === id);
  if (packed) return { now: packed.price ?? packed.base, was: packed.base };

  return { now: null, was: null };
}
