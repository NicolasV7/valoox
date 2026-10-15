import { FlowArt } from '../components/Flow.tsx';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route } from '../route.ts';

const CHANNEL: Route = { name: 'alerts', step: 'channel' };

export function AlertsStandby({ starred }: { starred: number }) {
  const s = t().alerts;
  return (
    <section class="flow__standby">
      <FlowArt art={FLOW.paused}>
        <div>
          <h2>{s.standby}</h2>
          <p>{starred > 0 ? s.standbyKept(starred) : t().flows.noEmail}</p>
        </div>
      </FlowArt>
      <a class="btn btn--quiet" href={href(CHANNEL)} onClick={intercept(CHANNEL)}>
        {s.addAnAddress}
      </a>
      <a
        class="btn btn--quiet"
        href={href({ name: 'alerts', step: 'discord' })}
        onClick={intercept({ name: 'alerts', step: 'discord' })}
      >
        {t().discord.connect}
      </a>
    </section>
  );
}
