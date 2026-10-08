// Alerts, first run.
//
// Two steps in the order they have to happen: a channel, then a star. The
// search is drawn and shut, because starring with nowhere to send is a row
// that can only disappoint — and a notifier quietly sending to nowhere is the
// one failure it must not hide.

import { Chevron, Mail } from '../components/icons.tsx';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

export function AlertsFirst({ channel, starred }: { channel: string; starred: number }) {
  const s = t().alerts;

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
      {/* Drawn and not yet a door: the screen it would open is not built. The
          tab bar does the same with the one tab that does not exist — a
          control that looks live and does nothing is the worst of the three. */}
      <div class="bell__row">
        <span class="bell__at">
          <Mail />
        </span>
        <span class="bell__id">
          <span class="bell__name">{s.yourEmail}</span>
          <span class="bell__said">{channel ? channel : s.oneAddress}</span>
        </span>
        <span class="bell__chev">
          <Chevron size={16} />
        </span>
      </div>

      <h2 class="label bell__step">{s.stepTwo}</h2>
      <div class="bell__row bell__row--shut">
        <span class="bell__id">
          <span class="bell__name">{s.searchASkin}</span>
          <span class="bell__said">{s.opensOnce}</span>
        </span>
      </div>

      <p class="legal bell__note">{s.whatAStarIs}</p>
    </main>
  );
}
