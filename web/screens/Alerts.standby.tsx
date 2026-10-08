// The list, kept, with nowhere to send.
//
// It is not an error and it is not empty. What you starred is exactly where
// you left it; the one thing missing is a verified address, and until there
// is one the daily job steps over this row. Saying that plainly beats a
// screen that works and quietly sends nothing, which is the one failure a
// notifier must not hide.

import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route } from '../route.ts';

const CHANNEL: Route = { name: 'alerts', step: 'channel' };

export function AlertsStandby({ starred }: { starred: number }) {
  const s = t().alerts;

  return (
    <div class="standby">
      <img class="standby__art" src={SPRAY.chill} alt="" width="104" height="104" />
      <p class="lede standby__lede">{s.standby}</p>
      <p class="small standby__under">{starred > 0 ? s.standbyKept(starred) : s.standbyNone}</p>
      <a class="btn standby__go" href={href(CHANNEL)} onClick={intercept(CHANNEL)}>
        {s.addAnAddress}
      </a>
    </div>
  );
}
