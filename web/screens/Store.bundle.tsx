// The bundle, as it appears on the store: one banner, tappable.
//
// Everything else on this screen is a thing with a price. A bundle is a set
// with a story, and Riot sells it on the artwork — so this is the one card on
// the store that leads with a picture and says only the two facts that decide
// whether you open it: what it is called and what it costs.
//
// The clock is a chip rather than a line of text. It sits on somebody's
// artwork, and a bare number there is unreadable half the time.

import { Countdown } from '../components/Countdown.tsx';
import { Money } from '../components/Money.tsx';
import type { Bundle } from '../data/types.ts';
import { useBundle } from '../data/usePiece.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function BundleCard({ bundle }: { bundle: Bundle }) {
  const found = useBundle(bundle.id);
  const route = { name: 'bundle', id: bundle.id } as const;

  return (
    <section class="store__block">
      <h2 class="label">{t().store.bundle}</h2>

      <a class="promo" href={href(route)} onClick={intercept(route)}>
        {found?.icon && <img class="promo__art" src={found.icon} alt="" loading="lazy" />}

        <Countdown from={bundle.remaining} className="promo__clock" />

        <span class="promo__foot">
          <span class="promo__name">
            {found?.name ?? <span class="skel" style={{ width: '168px', height: '22px' }} />}
          </span>
          <span class="promo__price">
            {bundle.allOwned && <span class="faint">{t().store.allOwned}</span>}
            <Money amount={bundle.price ?? bundle.base} size={14} />
          </span>
        </span>
      </a>
    </section>
  );
}
