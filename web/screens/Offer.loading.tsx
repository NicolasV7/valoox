// One piece opening.
//
// The same wait for an offer, a piece out of a bundle, and the same weapon
// reached from the collection: they are one screen with a different back link,
// so they wait the same way rather than each inventing a layout.
//
// The stage is 196px here and 196px when it lands, and the name block is three
// lines at the heights the real ones take.
//
// The levels and variants rows are drawn at four and then shrink or vanish:
// 857 skins in the catalogue have a single level and 880 have no chroma at
// all. Drawing the common case and settling down beats drawing nothing and
// springing open.

import { Chevron } from '../components/icons.tsx';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';

/** Four of each, which is the common case. */
const FOUR = [0, 1, 2, 3];

export function OfferLoading() {
  return (
    <main class="screen offer">
      {/* Real: it needs no data, and it is the one control on the screen. */}
      <button type="button" class="back" onClick={back}>
        <span class="offer__chev">
          <Chevron />
        </span>
        {t().common.nav.store}
      </button>

      <div class="offer__stage offer__stage--waiting">
        <span class="skel offer__seal--waiting" />
      </div>

      <div class="offer__id">
        <div class="offer__who">
          <span class="skel" style={{ width: '124px', height: '26px' }} />
          <span class="skel" style={{ width: '98px', height: '26px', marginTop: '7px' }} />
          <span class="skel" style={{ width: '78px', height: '12px', marginTop: '11px' }} />
        </div>
        <div class="offer__paid">
          <span class="skel" style={{ width: '88px', height: '20px' }} />
          <span class="skel" style={{ width: '62px', height: '12px', marginTop: '9px' }} />
        </div>
      </div>

      <div class="offer__head">
        <h2 class="label">{t().offer.levels}</h2>
      </div>
      <div class="pills">
        {FOUR.map((n) => (
          <span key={n} class="pill pill--waiting" />
        ))}
      </div>

      <div class="offer__head">
        <h2 class="label">{t().offer.variants}</h2>
      </div>
      <div class="swatches">
        {FOUR.map((n) => (
          <span key={n} class="swatch swatch--waiting">
            <span class="skel swatch__dot--waiting" />
            <span class="skel" style={{ width: '70%', height: '9px' }} />
          </span>
        ))}
      </div>
    </main>
  );
}
