// One line in a card on the account screen.
//
// Three shapes and the difference is whether there is somewhere to go. A row
// with a route is a link with a chevron; one with an `out` leaves the app
// entirely; one with neither is a line of text that looks like the rows around
// it and is not pretending to be a control, because a chevron that goes
// nowhere is worse than no chevron.
//
// `rel="noopener noreferrer"` on the outbound ones, and Referrer-Policy is
// already no-referrer for the whole origin — so what is on the other side
// learns that somebody arrived and nothing about where from.

import { Chevron } from '../components/icons.tsx';
import { href, intercept, type Route, type Whence } from '../route.ts';

export function Row({
  to,
  out,
  from,
  said,
  under,
  end,
  last = false,
}: {
  /** Where it goes, when it goes anywhere. */
  to?: Route;
  /** Or out of the app altogether — the source, the coffee. */
  out?: string;
  /** And where back goes from there. Without it the alerts screens fall back
   *  to their own section, so opening one from here cost you the way home. */
  from?: Whence;
  said: string;
  under: string;
  /** The word on the right — a state, or a count. */
  end?: string;
  last?: boolean;
}) {
  const inside = (
    <>
      <span class="deck__id">
        <span class="deck__said">{said}</span>
        <span class="deck__under">{under}</span>
      </span>
      <span class="deck__end">
        {end}
        {(to || out) && <Chevron size={15} />}
      </span>
    </>
  );

  const cls = 'deck__row' + (last ? '' : ' deck__row--rule');

  if (to) {
    return (
      <a class={cls} href={href(to)} onClick={intercept(to, from)}>
        {inside}
      </a>
    );
  }
  if (out) {
    return (
      <a class={cls} href={out} target="_blank" rel="noopener noreferrer">
        {inside}
      </a>
    );
  }
  return <div class={cls}>{inside}</div>;
}
