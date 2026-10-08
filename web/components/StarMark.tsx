// The star, as a control — and as a mark when there is nothing behind it.
//
// Starring with no verified address builds a list the daily job steps over,
// so an unlit star is a mark until there is somewhere to send. That is not a
// disabled button: a disabled button is a control you are being kept from,
// and this is a thing that is not a control yet. It says the same thing it
// always said — this one is not yours — and the alerts tab is where the
// reason lives, because that is the screen that can do something about it.
//
// A LIT one stays a control whatever the state of the address. Taking
// something off your own list is not an action that needs a reason, and a
// list you can only add to is a trap: lose the address after starring forty
// things and every one of them is stuck there.
//
// Where it is a control, it sits on top of a link rather than inside one:
// every place it appears is a tile or a row that opens something, and a
// button nested in an anchor is markup no browser agrees about. So it is a
// sibling, positioned over the corner, and it stops the click before the
// link sees it.
//
// What it writes is the id, the name you were looking at and Riot's item
// type — the daily job has no catalogue to look any of those up in, so the
// name on the row is the name the mail will carry.

import { usePrefs } from '../data/channel.ts';
import { type Star, useStars } from '../data/stars.ts';
import { t } from '../i18n/index.ts';
import { Star as Glyph } from './icons.tsx';

export function StarMark({ item, size = 15 }: { item: Star; size?: number }) {
  const { on, full, toggle } = useStars();
  const lit = on(item.id);
  const live = usePrefs()?.mail?.ok === true;

  if (!live && !lit) {
    return (
      <span class="star star--mark">
        <Glyph size={size} on={false} />
      </span>
    );
  }

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
