// The weekly accessory store: four pieces in Kingdom Credits, on their own
// seven-day clock.
//
// Shape follows the kind of thing, never the slot it came from. A card is a
// portrait and takes two rows, a title is a line of text and takes two columns,
// a spray and a charm are squares. That rule is what lets this grid and a
// ten-piece bundle be the same grid.

import { Countdown } from '../components/Countdown.tsx';
import { Money } from '../components/Money.tsx';
import { shapeOf } from '../data/catalogue.ts';
import type { AccessoryStore } from '../data/types.ts';
import { usePiece } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';

export function Accessories({ store }: { store: AccessoryStore }) {
  return (
    <section class="store__block">
      <div class="store__head">
        <h2 class="label">{t().store.accessories}</h2>
        <Countdown from={store.remaining} className="faint" />
      </div>
      <div class="grid">
        {store.items.map((it) => (
          <Piece key={it.id} type={it.type} id={it.id} cost={it.cost} qty={it.qty} />
        ))}
      </div>
    </section>
  );
}

function Piece({
  type,
  id,
  cost,
  qty,
}: {
  type: string;
  id: string;
  cost: number | null;
  qty: number;
}) {
  const found = usePiece(type, id);
  const shape = shapeOf(type);
  const art = useArt(found?.icon);

  return (
    <div class={'tile tile--' + shape + ' stage'} style={artStyle(art)}>
      {/* A title has no art, and the white default weave is the right answer
          rather than a missing-image box. */}
      {found?.icon && <img class="tile__art" src={found.icon} alt="" loading="lazy" />}
      {shape === 'text' && <span class="tile__text">{found?.name}</span>}

      <div class="tile__foot">
        <span class="tile__name">{shape === 'text' ? '' : (found?.name ?? '')}</span>
        <span class="tile__price">
          {qty > 1 && <span class="faint num">×{qty}</span>}
          <Money amount={cost} of="kc" size={13} />
        </span>
      </div>
    </div>
  );
}
