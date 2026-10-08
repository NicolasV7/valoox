// Today's store. The screen the whole product exists for, and the one with a
// ten-second budget: four offers, above the fold, without scrolling.
//
// Everything below the offers is secondary and deliberately reached rather than
// stumbled into — the bundle, the accessory store, the way out.

import { Countdown } from '../components/Countdown.tsx';
import { OfferRow } from '../components/OfferRow.tsx';
import { tierByPrice } from '../data/catalogue.ts';
import type { Offer as OfferData, StoreView } from '../data/types.ts';
import { useSkin } from '../data/usePiece.ts';
import { t } from '../i18n/index.ts';
import { intercept } from '../route.ts';
import { Accessories } from './Store.accessories.tsx';
import { BundleCard } from './Store.bundle.tsx';
import { StoreHeader } from './Store.header.tsx';

export function Store({ view }: { view: StoreView }) {
  const s = t().store;

  return (
    <main class="screen screen--flush store">
      <StoreHeader account={view.account} wallet={view.wallet} remaining={view.remaining} />

      <section class="store__block">
        <h2 class="label">{s.daily}</h2>
        <div class="store__rows">
          {view.offers.map((o) => (
            <Daily key={o.id} offer={o} />
          ))}
        </div>
      </section>

      {view.night && (
        <section class="store__block">
          <div class="store__head">
            <h2 class="label">{s.night}</h2>
            <Countdown from={view.night.remaining} className="store__clock" />
          </div>
          <div class="store__rows">
            {view.night.items.map((o) => (
              <Daily key={o.id} offer={o} was={o.cost} price={o.price} cut={o.percent} />
            ))}
          </div>
        </section>
      )}

      {view.bundles.map((b) => (
        <BundleCard key={b.id} bundle={b} />
      ))}

      {view.accessory && <Accessories store={view.accessory} />}

      <footer class="store__foot">
        <p class="legal">{s.notice}</p>
      </footer>
    </main>
  );
}

/** One offer. The name, the render and the tier are not in the payload — Riot
 *  answers in ids and the browser resolves them. */
function Daily({
  offer,
  was,
  price,
  cut,
}: {
  offer: OfferData;
  was?: number | null;
  price?: number | null;
  cut?: number;
}) {
  const found = useSkin(offer.id);
  const paid = price ?? offer.cost;

  return (
    <OfferRow
      name={found?.name ?? null}
      render={found?.icon ?? null}
      tier={tierByPrice(was ?? offer.cost)}
      cost={paid}
      was={cut ? was : null}
      href={'/offer/' + offer.id}
      onClick={intercept({ name: 'offer', id: offer.id })}
    />
  );
}
