// A piece opening.
//
// The stage follows the piece — square for a spray or a charm, taller for a
// card, shorter for a title — and the grid that sent you here already knows
// which kind it was, so the hole is the right height from the first frame.
// Without that the screen would resize under your thumb the moment the name
// landed, which is the one thing a skeleton exists to prevent.
//
// Below the name it follows the piece too, because the four screens diverge
// there: a charm has three facts, a card has its other two crops, a spray and
// a title have neither. The AccessoryLoading board draws two prose sections
// instead; they belong to an earlier accessory screen than the four opens, and
// a hole for something that never arrives is the collapse this is avoiding.
//
// There is no wash. The page behind an opened piece is washed in that piece's
// own average colour and that number cannot exist until the image does, so the
// wait is the plain ground and the colour arrives with the art rather than
// being guessed and corrected.

import { Chevron } from '../components/icons.tsx';
import type { Kind } from '../design/shapes.ts';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';

const THREE = [0, 1, 2];

export function PieceLoading({ kind }: { kind?: Kind | null }) {
  return (
    <main class="screen piece">
      <button type="button" class="back" onClick={back}>
        <span class="offer__chev">
          <Chevron />
        </span>
        {t().common.nav.store}
      </button>

      <div class={'piece__stage piece__stage--' + (kind ?? 'card') + ' piece__stage--waiting'} />

      <div class="offer__id">
        <div class="offer__who">
          <span class="skel" style={{ width: '152px', height: '28px' }} />
          <span class="skel" style={{ width: '124px', height: '11px', marginTop: '10px' }} />
        </div>
        <div class="offer__paid">
          <span class="skel" style={{ width: '82px', height: '22px' }} />
          <span class="skel" style={{ width: '96px', height: '12px', marginTop: '7px' }} />
        </div>
      </div>

      {/* A charm's three facts, at the height the rows will be. */}
      {kind === 'buddy' && (
        <dl class="facts--boxed">
          {THREE.map((n) => (
            <div class="facts__box" key={n}>
              <span class="skel" style={{ width: n === 1 ? '64px' : '48px', height: '13px' }} />
              <span
                class="skel"
                style={{ width: n === 1 ? '132px' : '78px', height: '13px', marginLeft: 'auto' }}
              />
            </div>
          ))}
        </dl>
      )}

      {/* A card's other two crops: the wide one, then the small one. */}
      {kind === 'card' && (
        <>
          <span class="skel label--waiting" style={{ width: '142px' }} />
          <div class="crop crop--wide crop--waiting" />
          <div class="crop crop--small crop--waiting">
            <span class="skel crop__thumb--waiting" />
            <div>
              <span class="skel" style={{ width: '104px', height: '15px' }} />
              <span class="skel" style={{ width: '136px', height: '11px', marginTop: '5px' }} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
