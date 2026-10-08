// The weekly accessory store: four pieces in Kingdom Credits, on their own
// seven-day clock.
//
// Shape follows the kind of thing, never the slot it came from. A card is a
// portrait and takes two rows, a title is a line of text and takes two columns,
// a spray and a charm are squares. That rule is what lets this grid and a
// ten-piece bundle be the same grid.
//
// It is never the same four pieces twice, so the grid is not laid out — it is
// solved. spans() reads the week's shapes and says which piece has to grow so
// the two columns come out whole. See design/shapes.ts.

import { Countdown } from '../components/Countdown.tsx';
import { Tile } from '../components/Tile.tsx';
import type { AccessoryStore } from '../data/types.ts';
import { shapeOf, spans } from '../design/shapes.ts';
import { t } from '../i18n/index.ts';

export function Accessories({ store }: { store: AccessoryStore }) {
  const shapes = store.items.map((it) => shapeOf(it.type));
  const grown = spans(shapes);

  return (
    <section class="store__block">
      <div class="store__head">
        <h2 class="label">{t().store.accessories}</h2>
        <Countdown from={store.remaining} className="store__clock" />
      </div>
      <div class="grid">
        {store.items.map((it, i) => (
          <Tile
            key={it.id}
            type={it.type}
            id={it.id}
            cost={it.cost}
            qty={it.qty}
            span={grown[i]}
            // A square here is 110px and its name already says what it is
            // ("Glitchpop Spray"). A card and a title have the room, and a
            // title's name — "Fortune" — says nothing at all on its own. One
            // that has grown has the room too.
            captioned={shapes[i] !== 'tile' || grown[i] !== 'normal'}
          />
        ))}
      </div>
    </section>
  );
}
