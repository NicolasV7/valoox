// One line in a card on the account screen.
//
// Two shapes and the difference is whether there is somewhere to go. A row
// with a route is a link with a chevron; one without is a line of text that
// looks like the rows around it and is not pretending to be a control — the
// pages behind three of them are on the site rather than in the app, and a
// chevron that goes nowhere is worse than no chevron.

import { Chevron } from '../components/icons.tsx';
import { href, intercept, type Route } from '../route.ts';

export function Row({
  to,
  said,
  under,
  end,
  last = false,
}: {
  /** Where it goes, when it goes anywhere. */
  to?: Route;
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
        {to && <Chevron size={15} />}
      </span>
    </>
  );

  const cls = 'deck__row' + (last ? '' : ' deck__row--rule');

  return to ? (
    <a class={cls} href={href(to)} onClick={intercept(to)}>
      {inside}
    </a>
  ) : (
    <div class={cls}>{inside}</div>
  );
}
