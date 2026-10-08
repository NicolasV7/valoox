// Alerts, working.
//
// Both halves show their own state rather than one summary: where it goes is
// a different fact from what is watched, and a screen that collapses them into
// "3 alerts set up" is a screen that cannot tell you the address bounced.
//
// The two clocks are Riot's own. Guns rotate daily and accessories weekly, and
// those are different numbers — writing one and calling it "the rotation"
// would be the screen guessing about the half it was not told.

import { Countdown } from '../components/Countdown.tsx';
import { Chevron, Mail, Search } from '../components/icons.tsx';
import { Watch } from '../components/Watch.tsx';
import { LEVELS } from '../data/findable.ts';
import { MAX, useStars } from '../data/stars.ts';
import type { Prefs, StoreView } from '../data/types.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route } from '../route.ts';

const CHANNEL: Route = { name: 'alerts', step: 'channel' };
const ADD: Route = { name: 'alerts', step: 'add' };

export function AlertsWorking({ mail, view }: { mail: Prefs['mail']; view: StoreView }) {
  const s = t().alerts;
  const { stars, on, full, toggle } = useStars();
  const all = stars ?? [];
  // Anything starred before the type was kept is a gun: that is all the app
  // could star back then.
  const guns = all.filter((w) => (w.type ?? LEVELS) === LEVELS);
  const bits = all.filter((w) => (w.type ?? LEVELS) !== LEVELS);
  const ok = mail?.ok === true;

  return (
    <main class="screen bell">
      <header class="bell__head">
        <h1>{t().common.nav.alerts}</h1>
        <p class="small">{s.what}</p>
      </header>

      <a class="watch__to" href={href(CHANNEL)} onClick={intercept(CHANNEL)}>
        <span class="watch__cap">
          <span class="label">{s.whereItGoes}</span>
          <span class="watch__change">{s.change}</span>
        </span>
        <span class="watch__who">
          <Mail />
          <span class="watch__addr">{mail?.to || s.yourEmail}</span>
          <span class={ok ? 'bell__state bell__state--ok' : 'bell__state bell__state--wait'}>
            <span class="bell__dot" />
            {ok ? s.verified : s.notVerified}
          </span>
          <Chevron size={15} />
        </span>
      </a>

      <Group said={s.weapons} left={view.remaining} />
      {guns.length ? (
        <div class="watch__list">
          {guns.map((w) => (
            <Watch key={w.id} item={w} on={on(w.id)} shut={full} toggle={toggle} />
          ))}
        </div>
      ) : (
        <p class="legal bell__note">{s.noGuns}</p>
      )}

      <Group said={s.accessories} left={view.accessory?.remaining ?? null} />
      {bits.length ? (
        <div class="watch__list">
          {bits.map((w) => (
            <Watch key={w.id} item={w} on={on(w.id)} shut={full} toggle={toggle} />
          ))}
        </div>
      ) : (
        <p class="legal bell__note">{s.noBits}</p>
      )}

      <div class="watch__add">
        <a class="find watch__find" href={href(ADD)} onClick={intercept(ADD)}>
          <Search />
          {s.addSomething}
        </a>
        <span class="watch__count num">{s.outOf(all.length, MAX)}</span>
      </div>

      <p class="legal bell__note">{s.onlyWhatTurnsUp}</p>
      <p class="legal bell__note">{s.hundredWhy}</p>
    </main>
  );
}

/** A section heading with the clock that governs it. Null when Riot did not
 *  send one — an accessory shop is absent, not zero. */
function Group({ said, left }: { said: string; left: number | null }) {
  return (
    <div class="watch__cap watch__cap--sect">
      <h2 class="label">{said}</h2>
      {left !== null && (
        <span class="watch__clock">
          {t().alerts.rotatesIn} <Countdown from={left} />
        </span>
      )}
    </div>
  );
}
