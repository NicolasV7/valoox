// The star, as a control.
//
// Always one, wherever it appears: on a tile, on a row, and on the screen
// that tile opens. It was a mark without a verified address for a while, on
// the reasoning that starring with nowhere to send builds a list the daily
// job steps over — which is true, and which the alerts tab already says in
// the one place that can do something about it.
//
// What that reasoning missed is that the list is the work and the address is
// the plumbing. Somebody goes through nine hundred sprays first and sets up
// the mail after, and a star that will not take a tap in the meantime turns
// the one into a precondition for the other. The standby card on the alerts
// screen is where that gets explained, in words, at the moment it matters.
//
// It sits on top of a link rather than inside one, because every place it
// appears is a tile or a row that opens something, and a button nested in an
// anchor is markup no browser agrees about. So it is a sibling, positioned
// over the corner, and it stops the click before the link sees it.
//
// What it writes is the id, the name you were looking at, Riot's item type,
// and what the screen knows about the thing — its tier, how many levels and
// colourways it has, the colour measured off its art. The daily job has no
// catalogue to look any of that up in, and the morning mail is drawn from it.

import { sold } from '../data/sellable.ts';
import { type Star, useStars } from '../data/stars.ts';
import { useGiven } from '../data/useIndex.ts';
import { t } from '../i18n/index.ts';
import { Star as Glyph } from './icons.tsx';

export function StarMark({ item, size = 15 }: { item: Star; size?: number }) {
  const s = t().alerts;
  const { on, shut, toggle } = useStars();
  const lit = on(item.id);
  // A contract reward is not merchandise: it is given out by a pass and no
  // store panel will ever carry it, so an alert on it could not fire. The
  // thing stays on screen and stays browsable — only the star is refused.
  // Unknown while the index loads, and unknown means yes.
  const can = sold(useGiven(), item.id);
  const closed = !lit && (shut(item.type) || !can);
  return (
    <button
      type="button"
      class={lit ? 'star star--on' : 'star'}
      disabled={closed}
      aria-pressed={lit}
      title={can ? undefined : s.notSoldWhy}
      aria-label={can ? s.watch(item.name) : s.notSoldOne(item.name)}
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
