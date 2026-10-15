import { FlowArt, FlowHeading, FlowStep } from '../components/Flow.tsx';
import { receiving } from '../data/destinations.ts';
import type { Prefs } from '../data/types.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';
import { AlertsDestinations } from './Alerts.destinations.tsx';

export function AlertsFirst({ prefs }: { prefs: Prefs }) {
  const s = t().alerts;
  const f = t().flows;
  const to = { name: 'alerts', step: prefs.emailAvailable ? 'channel' : 'discord' } as const;
  const add = { name: 'alerts', step: 'add' } as const;
  const ok = receiving(prefs);
  return (
    <main class="screen flow">
      <FlowHeading eyebrow={f.startList} title={f.firstTitle} lead={f.firstLead} />
      <FlowArt art={FLOW.first}>
        <span class="label">{s.noneYet}</span>
      </FlowArt>
      <FlowStep number={1} title={prefs.emailAvailable ? f.pickInbox : t().discord.connect}>
        {prefs.emailAvailable ? f.inboxProof : t().discord.lead}
      </FlowStep>
      <AlertsDestinations prefs={prefs} />
      <FlowStep number={2} title={f.makeList}>
        {f.listKinds}
      </FlowStep>
      <a class="btn" href={href(ok ? add : to)} onClick={intercept(ok ? add : to)}>
        {ok ? f.add : prefs.emailAvailable ? f.setUp : t().discord.connect}
      </a>
      {!ok && (
        <a class="btn btn--quiet" href={href(add)} onClick={intercept(add)}>
          {f.buildList}
        </a>
      )}
      {prefs.emailAvailable && <p class="flow__note">{s.sameInbox}</p>}
    </main>
  );
}
