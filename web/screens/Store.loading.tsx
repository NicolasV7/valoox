// The store, waiting.
//
// The skeleton is the store with its content removed, measured against it:
// same band heights, same paddings, same card heights, same gaps. A loading
// state that does not match is worse than none — the page reflows the moment
// the data lands, and the thing you were about to tap moves.
//
// The four cards step down in weight rather than pulsing. The eye reads a
// column that fades as something arriving, and it needs no animation to do it:
// a skeleton that animates is asking to be looked at, and it is the one thing
// on screen with nothing to say.
//
// The labels are real. Only what is in flight is grey, which is what makes the
// grey mean something — and "DAILY OFFERS" tells you what you are waiting for,
// which a grey bar of the same size does not.

import { Tabs } from '../components/Tabs.tsx';
import { t } from '../i18n/index.ts';

export function StoreLoading() {
  const s = t().store;

  return (
    <>
      <main class="screen screen--flush store">
        <header class="head">
          <div class="head__who">
            <span class="skel head__badge--waiting" />
            <div class="head__id">
              <span class="skel" style={{ width: '124px', height: '20px' }} />
              <span class="skel" style={{ width: '96px', height: '11px', marginTop: '6px' }} />
            </div>
          </div>

          <div class="head__line">
            <span class="skel" style={{ width: '62px', height: '16px' }} />
            <span class="skel" style={{ width: '44px', height: '16px' }} />
            <span class="skel" style={{ width: '54px', height: '16px' }} />
            <span class="skel head__clock" style={{ width: '64px', height: '16px' }} />
          </div>
        </header>

        {/* The board holds a slot up here for the wishlist line — "Reaver
            Vandal is here today". It is not drawn: the line needs a wishlist,
            which is not built, so a skeleton for it would promise something
            that never arrives and then collapse. It comes back with the
            feature, on both screens at once. */}

        <section class="store__block">
          <h2 class="label">{s.daily}</h2>
          <div class="store__rows rows--waiting">
            <Card lines={['78px', '118px', '92px']} />
            <Card lines={['64px', '136px', '104px']} />
            <Card lines={['70px', '102px', '88px']} />
            <Card lines={['66px', '126px']} />
          </div>
        </section>

        <section class="store__block">
          <h2 class="label">{s.bundle}</h2>
          <div class="promo promo--waiting" />
        </section>

        <footer class="store__foot">
          <p class="legal">{s.notice}</p>
        </footer>
      </main>
      <Tabs />
    </>
  );
}

/** One offer-shaped hole: the tier, the name, the price, at the widths a real
 *  one takes. The row is the same 130px, so nothing moves when it fills. */
function Card({ lines }: { lines: string[] }) {
  return (
    <div class="row row--waiting" aria-hidden="true">
      <span class="skel" style={{ width: lines[0], height: '12px' }} />
      <span class="skel" style={{ width: lines[1], height: '18px' }} />
      {lines[2] && <span class="skel" style={{ width: lines[2], height: '18px' }} />}
    </div>
  );
}
