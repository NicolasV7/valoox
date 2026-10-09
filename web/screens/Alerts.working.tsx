// Alerts, working.
//
// Both halves show their own state rather than one summary: where it goes is
// a different fact from what is watched, and a screen that collapses them into
// "3 alerts set up" is a screen that cannot tell you the address bounced.
//
// The two clocks are Riot's own. Guns rotate daily and accessories weekly, and
// those are different numbers — writing one and calling it "the rotation"
// would be the screen guessing about the half it was not told.
//
// Accessories split four ways under their own heading. A hundred of them in
// one column is a scroll nobody reads to the end of, and the four are not one
// list: a spray and a title have nothing to do with each other beyond sharing
// a rotation. The count rides on each tab so the split costs no information —
// you can see where your stars are without opening all four.

import { Countdown } from '../components/Countdown.tsx';
import { Chevron, Mail, Search } from '../components/icons.tsx';
import { Pick } from '../components/Pick.tsx';
import { Watch } from '../components/Watch.tsx';
import { waiting } from '../data/channel.ts';
import { LEVELS } from '../data/findable.ts';
import { useKept } from '../data/kept.ts';
import { BITS, GUNS, type Star, useStars } from '../data/stars.ts';
import type { Prefs, StoreView } from '../data/types.ts';
import { kindOf } from '../design/shapes.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route, type Whence } from '../route.ts';
import { AlertsStandby } from './Alerts.standby.tsx';

const CHANNEL: Route = { name: 'alerts', step: 'channel' };
const CODE: Route = { name: 'alerts', step: 'code' };
const ADD: Route = { name: 'alerts', step: 'add' };

/** Which accessory a starred row is. Anything unrecognised reads as a spray —
 *  a row has to be under some tab, and that is the commonest kind. */
const bitKind = (w: Star): string => kindOf(w.type ?? '') ?? 'spray';

export function AlertsWorking({ prefs, view }: { prefs: Prefs; view: StoreView }) {
  const s = t().alerts;
  const mail = prefs.mail;
  // Six digits already out: the card leads to the boxes rather than back to
  // the field they were asked for in.
  const to = waiting(prefs) && mail?.ok !== true ? CODE : CHANNEL;
  const { stars, on, shut, toggle } = useStars();
  const [picked, pick] = useKept('alerts-bit');
  const all = stars ?? [];
  // Anything starred before the type was kept is a gun: that is all the app
  // could star back then.
  const guns = all.filter((w) => (w.type ?? LEVELS) === LEVELS);
  const bits = all.filter((w) => (w.type ?? LEVELS) !== LEVELS);
  const kinds = t().collection.tab;
  const tabs: Array<[string, string]> = [
    ['spray', kinds.sprays],
    ['buddy', kinds.buddies],
    ['card', kinds.cards],
    ['title', kinds.titles],
  ];
  // The first tab that has anything, unless one was chosen. Landing on an
  // empty Sprays when every star is a card says nothing true about the list.
  const tab = picked || tabs.find(([k]) => bits.some((w) => bitKind(w) === k))?.[0] || 'spray';
  const here = bits.filter((w) => bitKind(w) === tab);
  const ok = mail?.ok === true;
  // A starred row opens the thing, and the way back out of it is this list.
  const from: Whence = { to: { name: 'alerts' }, said: t().common.nav.alerts };

  return (
    <main class="screen bell">
      <header class="bell__head">
        <h1>{t().common.nav.alerts}</h1>
        <p class="small">{s.what}</p>
      </header>

      <a class="watch__to" href={href(to)} onClick={intercept(to)}>
        <span class="watch__cap">
          <span class="label">{s.whereItGoes}</span>
          <span class="watch__change">{s.change}</span>
        </span>
        <span class="watch__who">
          <Mail />
          <span class="watch__addr">{mail?.to || s.yourEmail}</span>
          <span class={ok ? 'bell__state bell__state--ok' : 'bell__state bell__state--wait'}>
            <span class="bell__dot" />
            {ok ? s.verified : waiting(prefs) ? s.oneIsOut : s.notVerified}
          </span>
          <Chevron size={15} />
        </span>
      </a>

      {!ok && <AlertsStandby starred={all.length} />}

      <Group said={s.weapons} left={view.remaining} />
      {guns.length ? (
        <div class="watch__list">
          {guns.map((w) => (
            <Watch
              key={w.id}
              item={w}
              on={on(w.id)}
              shut={shut(w.type)}
              from={from}
              toggle={toggle}
            />
          ))}
        </div>
      ) : (
        <p class="legal bell__note">{s.noGuns}</p>
      )}

      <Group said={s.accessories} left={view.accessory?.remaining ?? null} />
      {bits.length ? (
        <>
          <div class="pills watch__picks">
            {tabs.map(([key, said]) => (
              <Pick
                key={key}
                said={s.withCount(said, bits.filter((w) => bitKind(w) === key).length)}
                on={tab === key}
                choose={() => pick(key)}
              />
            ))}
          </div>
          <div class="watch__list">
            {here.map((w) => (
              <Watch
                key={w.id}
                item={w}
                on={on(w.id)}
                shut={shut(w.type)}
                from={from}
                toggle={toggle}
              />
            ))}
          </div>
        </>
      ) : (
        <p class="legal bell__note">{s.noBits}</p>
      )}

      <div class="watch__add">
        {ok ? (
          <a class="find watch__find" href={href(ADD)} onClick={intercept(ADD)}>
            <Search />
            {s.addSomething}
          </a>
        ) : (
          <span class="find watch__find watch__find--shut">
            <Search />
            {s.addSomething}
          </span>
        )}
        <span class="watch__count num">{s.outOfBoth(guns.length, GUNS, bits.length, BITS)}</span>
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
