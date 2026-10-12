import { FlowArt, FlowHeading, FlowRow, FlowState, FlowStep } from '../components/Flow.tsx';
import type { Prefs } from '../data/types.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function AlertsFirst({
  mail,
  coded,
}: {
  mail: Prefs['mail'];
  starred: number;
  coded: boolean;
}) {
  const s = t().alerts;
  const f = t().flows;
  const to = { name: 'alerts', step: coded ? 'code' : 'channel' } as const;
  const add = { name: 'alerts', step: 'add' } as const;
  const ok = mail?.ok === true;
  return (
    <main class="screen flow">
      <FlowHeading eyebrow={f.startList} title={f.firstTitle} lead={f.firstLead} />
      <FlowArt art={FLOW.first}>
        <span class="label">{s.noneYet}</span>
      </FlowArt>
      <FlowStep number={1} title={f.pickInbox}>
        {f.inboxProof}
      </FlowStep>
      {mail && (
        <FlowRow
          to={to}
          label={s.whereItGoes}
          title={mail.to}
          state={
            <FlowState kind={ok ? 'ok' : 'wait'}>
              {ok ? s.verified : coded ? s.oneIsOut : s.notVerified}
            </FlowState>
          }
        />
      )}
      <FlowStep number={2} title={f.makeList}>
        {f.listKinds}
      </FlowStep>
      <a class="btn" href={href(ok ? add : to)} onClick={intercept(ok ? add : to)}>
        {ok ? f.add : f.setUp}
      </a>
      {!ok && (
        <a class="btn btn--quiet" href={href(add)} onClick={intercept(add)}>
          {f.buildList}
        </a>
      )}
      <p class="flow__note">{s.sameInbox}</p>
    </main>
  );
}
