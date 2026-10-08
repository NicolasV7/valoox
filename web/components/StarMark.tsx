// The star, as a control.
//
// It sits on top of a link rather than inside one, because every place it
// appears is a tile or a row that opens something, and a button nested in an
// anchor is markup no browser agrees about. So it is a sibling, positioned
// over the corner, and it stops the click before the link sees it.
//
// What it writes is the id, the name you were looking at and Riot's item
// type — the daily job has no catalogue to look any of those up in, so the
// name on the row is the name the mail will carry.

import { type Star, useStars } from '../data/stars.ts';
import { t } from '../i18n/index.ts';
import { Star as Glyph } from './icons.tsx';

export function StarMark({ item, size = 15 }: { item: Star; size?: number }) {
  const { on, full, toggle } = useStars();
  const lit = on(item.id);

  return (
    <button
      type="button"
      class={lit ? 'star star--on' : 'star'}
      disabled={!lit && full}
      aria-pressed={lit}
      aria-label={t().alerts.watch(item.name)}
      onClick={(e) => {
        // The row underneath is a link to the thing this is about. Starring
        // it is not opening it.
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
    >
      <Glyph size={size} on={lit} />
    </button>
  );
}
