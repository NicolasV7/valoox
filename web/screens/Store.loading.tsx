// The store, waiting.
//
// Drawn from the Loading board rather than from the store: same band heights,
// same paddings, same card height, same gaps, same bar widths. Every number in
// here and in its half of store.css is the board's.
//
// The four cards step down in weight rather than pulsing. The eye reads a
// column that fades as something arriving, and it needs no animation to do it:
// a skeleton that animates is asking to be looked at, and it is the one thing
// on screen with nothing to say.
//
// Every label is grey too, the way the board draws them: nothing on the screen
// is readable until the screen is. The exceptions are the tab bar and the
// disclaimer, which are not about the store at all.

import { Tabs } from '../components/Tabs.tsx';
import { t } from '../i18n/index.ts';

/** The bars inside each card, at the board's widths. The fourth has two rather
 *  than three, which is what makes the column look like it is still filling. */
const CARDS = [
  ['78px', '118px', '92px'],
  ['64px', '136px', '104px'],
  ['70px', '102px', '88px'],
  ['66px', '126px'],
];

export function StoreLoading() {
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

        {/* The headline's slot, held whether or not there is anything in it, so
            nothing below it moves on the day there is. */}
        <div class="hit--waiting">
          <span class="skel skel--tight" style={{ width: '16px', height: '16px' }} />
          <span class="skel" style={{ width: '212px', height: '17px' }} />
        </div>

        <section class="store__block">
          <span class="skel label--waiting" style={{ width: '86px' }} />
          <div class="cards--waiting">
            {CARDS.map((bars) => (
              <div class="card--waiting" key={bars[1]} aria-hidden="true">
                <span class="skel skel--tight" style={{ width: bars[0], height: '12px' }} />
                <span class="skel" style={{ width: bars[1], height: '18px', marginTop: '10px' }} />
                {bars[2] && (
                  <span class="skel" style={{ width: bars[2], height: '18px', marginTop: '4px' }} />
                )}
              </div>
            ))}
          </div>
        </section>

        <section class="store__block">
          <span class="skel label--waiting" style={{ width: '62px' }} />
          <div class="promo promo--waiting" />
        </section>

        <footer class="store__foot">
          <p class="legal">{t().store.notice}</p>
        </footer>
      </main>
      <Tabs />
    </>
  );
}
