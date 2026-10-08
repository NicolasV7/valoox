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
import { tierByPrice } from '../data/catalogue.ts';
import type { StoreView } from '../data/types.ts';
import { useSkin } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';

export function Offer({ id, view }: { id: string; view: StoreView }) {
  const found = useSkin(id);
  const art = useArt(found?.icon);

  // The price is the store's, not the catalogue's — the same skin costs
  // something different in the night market, and that is the number on screen.
  const sold =
    view.offers.find((o) => o.id === id) ?? view.night?.items.find((o) => o.id === id) ?? null;
  const paid =
    sold && 'price' in sold
      ? ((sold as { price: number | null }).price ?? sold.cost)
      : (sold?.cost ?? null);
  const tier = tierByPrice(sold?.cost ?? null);

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
            <Money amount={paid} size={17} />
          </span>
        </div>
      </div>
    </main>
  );
}
