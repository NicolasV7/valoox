// One piece opening.
//
// The same wait for an offer, a piece out of a bundle, and the same weapon
// reached from the collection: they are one screen with a different back link,
// so they wait the same way rather than each inventing a layout.
//
// The stage is 196px here and 196px when it lands, and the name block is three
// lines at the heights the real ones take. What is NOT drawn is the levels and
// the variants: the screen cannot show them yet — a skin level carries no
// reference to its parent, and the only way up is the weapons index the
// collection brings with it — so a skeleton for them would be a promise of
// something that is not coming.

import { Chevron } from '../components/icons.tsx';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';

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
    </main>
  );
}
