// Alerts, first run.
//
// Two steps in the order they have to happen: a channel, then a star. The
// search is drawn and shut, because starring with nowhere to send is a row
// that can only disappoint — and a notifier quietly sending to nowhere is the
// one failure it must not hide.

import { Chevron, Mail } from '../components/icons.tsx';
import type { Prefs } from '../data/types.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function AlertsFirst({ mail, starred }: { mail: Prefs['mail']; starred: number }) {
  const s = t().alerts;
  const to = { name: 'alerts', step: 'channel' } as const;
  const ok = mail?.ok === true;

  return (
    <main class="screen bell">
      <header class="bell__head">
        <h1>{t().common.nav.alerts}</h1>
        <p class="small">{s.what}</p>
      </header>

      <div class="nothing bell__none">
        <img src={SPRAY.crab} alt="" width="86" height="86" />
        <p class="lede">{starred === 0 ? s.noneYet : s.someYet(starred)}</p>
        <p class="small">{s.twoThings}</p>
      </div>

      <h2 class="label bell__step">{s.stepOne}</h2>
      <a class="bell__row" href={href(to)} onClick={intercept(to)}>
        <span class="bell__at">
          <Mail />
        </span>
        <span class="bell__id">
          <span class="bell__name">{mail?.to || s.yourEmail}</span>
          <span class={ok ? 'bell__said bell__said--ok' : 'bell__said'}>
            {ok ? s.verified : mail?.to ? s.notVerifiedYet : s.oneAddress}
          </span>
        </span>
        <span class="bell__chev">
          <Chevron size={16} />
        </span>
      </a>

      <h2 class="label bell__step">{s.stepTwo}</h2>
      {/* Shut until step one is done, and the reason is on it. */}
      <div class="bell__row bell__row--shut">
        <span class="bell__id">
          <span class="bell__name">{s.searchASkin}</span>
          <span class="bell__said">{ok ? s.comingNext : s.opensOnce}</span>
        </span>
      </div>

      <p class="legal bell__note">{s.whatAStarIs}</p>
    </main>
  );
}
