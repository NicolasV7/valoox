// The weekly accessory store: four pieces in Kingdom Credits, on their own
// seven-day clock.
//
// Shape follows the kind of thing, never the slot it came from. A card is a
// portrait and takes two rows, a title is a line of text and takes two columns,
// a spray and a charm are squares. That rule is what lets this grid and a
// ten-piece bundle be the same grid.
//
// It is never the same four pieces twice, so the grid is not laid out — it is
// solved. lay() groups the week by kind, puts the cards first and the charms
// last, and says which piece has to grow so the two columns come out whole.
// See design/shapes.ts.

import { Countdown } from '../components/Countdown.tsx';
import { Tile } from '../components/Tile.tsx';
import type { AccessoryStore } from '../data/types.ts';
import { kindOf, lay, shapeOf } from '../design/shapes.ts';
import { t } from '../i18n/index.ts';

export function Accessories({ store }: { store: AccessoryStore }) {
  const { order, span } = lay(store.items.map((it) => kindOf(it.type)));

  return (
    <section class="store__block">
      <div class="store__head">
        <h2 class="label">{t().store.accessories}</h2>
        <Countdown from={store.remaining} className="store__clock" />
      </div>
      <div class="grid">
        {order.map((i) => {
          const it = store.items[i];
          if (!it) return null;
          return (
            <Tile
              key={it.id}
              type={it.type}
              id={it.id}
              cost={it.cost}
              qty={it.qty}
              span={span[i]}
              // A square here is 110px and its name already says what it is
              // ("Glitchpop Spray"). A card and a title have the room, and a
              // title's name — "Fortune" — says nothing at all on its own. One
              // that has grown has the room too.
              captioned={shapeOf(it.type) !== 'tile' || span[i] !== 'normal'}
            />
          );
        })}
      </div>
    </section>
  );
}
