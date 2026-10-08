// One row of the alerts list: the thing, and whether it is starred.
//
// The same row on both screens that have one, because they are the same row —
// a thing you are watching and a thing you could watch differ by the fill of
// one star, and drawing them twice is how the two drift apart.
//
// The picture comes from the catalogue, one small request per item, cached for
// the life of the page. The weave behind it is measured off that picture, so a
// row is the colour of the thing on it.

import { usePiece } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { Star } from './icons.tsx';

/** Guns get the letterbox, everything else gets the square. A render is 512
 *  across whatever it is of, so without this a spray arrives as wide as an
 *  Operator. */
const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

export interface Thing {
  id: string;
  name: string;
  type?: string;
}

export function Watch({
  item,
  on,
  shut,
  note,
  toggle,
}: {
  item: Thing;
  on: boolean;
  /** No room left. The star still unstars; it just cannot add. */
  shut?: boolean;
  /** What it is and what it costs, when the screen knows. */
  note?: string;
  toggle: (item: Thing) => void;
}) {
  const type = item.type ?? LEVELS;
  const piece = usePiece(type, item.id);
  const icon = piece?.tall ?? piece?.icon ?? null;
  const art = useArt(icon);
  const gun = type === LEVELS;

  return (
    <div class="watch" style={artStyle(art)}>
      {icon ? (
        <img class={gun ? 'watch__art' : 'watch__art watch__art--square'} src={icon} alt="" />
      ) : (
        <span class="watch__art" />
      )}
      <span class="watch__id">
        <span class="watch__name">{item.name}</span>
        {note && <span class="watch__note num">{note}</span>}
      </span>
      <button
        type="button"
        class={on ? 'star star--inline star--on' : 'star star--inline'}
        disabled={!on && shut}
        aria-pressed={on}
        aria-label={item.name}
        onClick={() => toggle(item)}
      >
        <Star size={19} on={on} />
      </button>
    </div>
  );
}
