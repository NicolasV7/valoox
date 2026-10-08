// The store, waiting.
//
// Four rules, and this screen is where they are most visible. One grey and no
// shimmer: a skeleton that animates is asking to be looked at, and it is the
// one thing here with nothing to say. Final sizes, so nothing jumps when the
// data lands. Everything that needs no data is drawn for real — the tab bar,
// the section labels, the disclaimer. And the parts whose shape genuinely is
// not known yet, like how many pieces a bundle holds, are simply absent rather
// than guessed at.

import { OfferRowLoading } from '../components/OfferRow.tsx';
import { Tabs } from '../components/Tabs.tsx';
import { t } from '../i18n/index.ts';

export function StoreLoading() {
  return (
    <>
      <main class="screen screen--flush store">
        <header class="head head--waiting">
          <div class="head__who">
            <span class="skel" style={{ width: '112px', height: '18px' }} />
            <span class="skel" style={{ width: '84px', height: '11px', marginTop: '7px' }} />
          </div>
          <div class="head__line">
            <span class="skel" style={{ width: '62px', height: '13px' }} />
            <span class="skel" style={{ width: '44px', height: '13px' }} />
            <span class="skel" style={{ width: '54px', height: '13px' }} />
          </div>
        </header>

        <section class="store__block">
          {/* Real, because it needs no data. Only what is in flight is grey,
              which is what makes the grey mean something. */}
          <h2 class="label">{t().store.daily}</h2>
          <div class="store__rows">
            <OfferRowLoading />
            <OfferRowLoading />
            <OfferRowLoading />
            <OfferRowLoading />
          </div>
        </section>

        <footer class="store__foot">
          <p class="legal">{t().store.notice}</p>
        </footer>
      </main>
      <Tabs />
    </>
  );
}
