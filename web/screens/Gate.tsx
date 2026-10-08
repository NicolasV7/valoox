// The screen a stranger reads before scanning a code that signs into their game
// account. It is the only screen in the app whose job is to be believed, which
// is why the four facts are set as text rather than as four identical cards:
// a card is a container doing the thinking, and a rule between lines separates
// them just as well while claiming nothing.

import { Wordmark } from '../components/Mark.tsx';
import { t } from '../i18n/index.ts';

/** The host the QR points at. Not copy — it is the thing being verified, and
 *  the whole point of the line is that it is the same string every time. */
const RIOT = 'auth.riotgames.com';

export function Gate({ onScan }: { onScan: () => void }) {
  const s = t().gate;
  const facts = [
    [s.facts.password, s.facts.passwordWhy],
    [s.facts.keep, s.facts.keepWhy],
    [s.facts.read, s.facts.readWhy],
    [s.facts.leave, s.facts.leaveWhy],
  ];

  return (
    <div class="screen gate">
      <Wordmark size={17} />

      <h1 class="gate__title">{s.title}</h1>
      <p class="lede gate__lede">{s.lede}</p>

      <dl class="facts">
        {facts.map(([term, why]) => (
          <div class="facts__row" key={term}>
            <dt class="facts__term">{term}</dt>
            <dd class="facts__why">{why}</dd>
          </div>
        ))}
      </dl>

      <div class="gate__foot">
        <button type="button" class="btn" onClick={onScan}>
          {s.show}
        </button>
        <p class="faint gate__dest">
          {s.destination} <code class="num">{RIOT}</code>. {s.destinationWhy}
        </p>
      </div>
    </div>
  );
}
