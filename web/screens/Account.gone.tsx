// Riot said no.
//
// Not an error of ours, and it says which of the two things happened, because
// only one of them is worth scanning again for.
//
// It exists because the alternative was the sign-in screen: a person coming
// back the next morning to a session Riot had retired got the same wall a
// stranger gets, with no sentence explaining that nothing had gone wrong and
// that their list was untouched.
//
// What it does NOT print is Riot's own reason. The board drew a chip reading
// "riot 400 · invalid_grant", and that slug is in a response body this Worker
// does not parse and would not forward — a page cannot quote something it was
// never given. The chip says what is actually known: the stored cookies were
// refused.

import { Mark } from '../components/Mark.tsx';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

export function AccountGone({ onScan, onWait }: { onScan: () => void; onWait: () => void }) {
  const s = t().account;

  return (
    <main class="screen deck deck--gone">
      <p class="deck__chip num">
        <span class="bell__dot" />
        {s.itEnded}
      </p>

      <div class="bell__crown deck__crown">
        <h1 class="deck__title">{s.gone}</h1>
        {/* Yoru asleep. A session that ran out rather than broke, which is
            what this screen is for saying. */}
        <img src={SPRAY.asleep} alt="" width="84" height="84" />
      </div>
      <p class="lede deck__lede">{s.goneLede}</p>

      <div class="deck__pair">
        <button type="button" class="btn" onClick={onScan}>
          {s.scanAgain}
        </button>
        <button type="button" class="btn btn--quiet" onClick={onWait}>
          {s.notNow}
        </button>
      </div>

      <h2 class="label deck__band">{s.whichTwo}</h2>
      <div class="deck__list">
        <div class="deck__fact">
          <span class="deck__said">{s.itEnded}</span>
          <span class="deck__why">{s.itEndedWhy}</span>
        </div>
      </div>
      <div class="deck__list deck__list--not">
        <div class="deck__fact">
          <span class="deck__said">{s.riotChanged}</span>
          <span class="deck__why">{s.riotChangedWhy}</span>
        </div>
      </div>

      <p class="legal deck__note">{s.jobSkips}</p>

      <p class="deck__sign">
        <Mark size={18} />
        valoox
      </p>
    </main>
  );
}
