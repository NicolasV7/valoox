// A piece of the catalogue that is not a gun: a card, a spray, a charm, a title.
//
// Shape follows the KIND of thing, never the slot it came from — a card is a
// portrait wherever it turns up, a title is a line of text, everything else is
// a square. That one rule is what lets the weekly accessory store and a bundle
// of ten mixed pieces be the same grid with nothing special-cased.
//
// `kind` is the caption under the name, and the caller decides whether there is
// room for it. A square in the accessory store is 110px and the name already
// says what it is ("Glitchpop Spray"); the same square inside a bundle holds a
// piece called "Dragon", which says nothing without it.

import { usePiece } from '../data/usePiece.ts';
import { kindOf, type Span, shapeOf } from '../design/shapes.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';
import { TitleMark } from './icons.tsx';
import { type Coin, Money } from './Money.tsx';

export function Tile({
  type,
  id,
  cost,
  was,
  qty,
  of = 'kc',
  bare = false,
  captioned = false,
  span = 'normal',
}: {
  type: string;
  id: string;
  cost: number | null;
  was?: number | null;
  qty?: number;
  of?: Coin;
  /** Without the coin, where the screen has already said which one it is. */
  bare?: boolean;
  /** Whether there is room under the name for what the thing is. */
  captioned?: boolean;
  /** Grown to close a hole the grid would otherwise have. See design/shapes.ts. */
  span?: Span;
}) {
  const found = usePiece(type, id);
  const shape = shapeOf(type);
  const kind = kindOf(type);
  const art = useArt(found?.icon);
  const cut = was != null && was !== cost;
  const route = { name: 'piece', id } as const;

  return (
    <a
      class={'tile tile--' + shape + (span === 'normal' ? '' : ' tile--' + span) + ' stage'}
      style={artStyle(art)}
      href={href(route)}
      onClick={intercept(route)}
    >
      {/* A title carries no art at all, and the white default weave is the
          right answer rather than a missing-image box. */}
      {found?.icon && <img class="tile__art" src={found.icon} alt="" loading="lazy" />}
      {shape === 'text' && (
        <span class="tile__text">
          <TitleMark />
          {found?.name}
        </span>
      )}

      <div class="tile__foot">
        {shape !== 'text' && <span class="tile__name">{found?.name ?? ''}</span>}

        <span class="tile__meta">
          {captioned && kind && <span class="tile__kind">{t().common.kind[kind]}</span>}
          <span class="tile__price">
            {qty != null && qty > 1 && <span class="faint num">×{qty}</span>}
            <Money amount={cost} of={of} size={13} bare={bare} />
            {cut && <Money amount={was} of={of} struck size={11} bare={bare} />}
          </span>
        </span>
      </div>
    </a>
  );
}

/** The same tile with nothing in it, at the size the real one will be. */
export function TileLoading({ shape = 'tile' }: { shape?: string }) {
  return (
    <div class={'tile tile--' + shape + ' tile--waiting'} aria-hidden="true">
      <div class="tile__foot">
        <span class="skel" style={{ width: '74%', height: '11px' }} />
        <span class="skel" style={{ width: '50%', height: '10px', marginTop: '6px' }} />
      </div>
    </div>
  );
}
