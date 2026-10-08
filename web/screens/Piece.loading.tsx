// A piece opening.
//
// The stage is the only thing whose height depends on what is coming, and the
// grid that sent you here already knows which kind it was — so it is passed
// in, and the hole is the right height from the first frame. Without it the
// screen would resize under your thumb the moment the name resolved.

import { Chevron } from '../components/icons.tsx';
import type { Kind } from '../design/shapes.ts';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';

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
          <span class="skel" style={{ width: '142px', height: '28px' }} />
          <span class="skel" style={{ width: '104px', height: '28px', marginTop: '6px' }} />
          <span class="skel" style={{ width: '70px', height: '12px', marginTop: '10px' }} />
        </div>
        <div class="offer__paid">
          <span class="skel" style={{ width: '82px', height: '22px' }} />
          <span class="skel" style={{ width: '96px', height: '12px', marginTop: '7px' }} />
        </div>
      </div>
    </main>
  );
}
