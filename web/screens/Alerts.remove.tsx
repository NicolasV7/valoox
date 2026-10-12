import { useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { FlowArt, FlowBrand, FlowHeading, FlowInfo, FlowState } from '../components/Flow.tsx';
import { useAction } from '../data/action.ts';
import { post, reseeded } from '../data/api.ts';
import { held, reload, usePrefs } from '../data/channel.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { go, href, intercept } from '../route.ts';
import { AlertsLoading } from './Alerts.loading.tsx';

const CHANNEL = { name: 'alerts', step: 'channel' } as const;
const ADD = { name: 'alerts', step: 'add' } as const;

export function AlertsRemove() {
  const prefs = usePrefs();
  const f = t().flows;
  const { busy, run } = useAction();
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!prefs) return <AlertsLoading step="channel" />;
  const to = prefs.mail?.to;
  const count = prefs.wishlist.length;
  if (!to)
    return (
      <main class="screen flow">
        <FlowBrand />
        <FlowHeading
          eyebrow={f.listWithYou}
          title={f.keptTitle}
          lead={done ? f.keptLead(count) : f.noEmail}
        />
        <FlowArt art={FLOW.kept}>
          <FlowState>{f.noEmail}</FlowState>
        </FlowArt>
        <div class="flow__summary">
          <span>{f.saved}</span>
          <strong class="num">{count}</strong>
        </div>
        <a class="btn" href={href(ADD)} onClick={intercept(ADD)}>
          {f.buildList}
        </a>
        <a class="btn btn--quiet" href={href(CHANNEL)} onClick={intercept(CHANNEL)}>
          {f.setUpAgain}
        </a>
      </main>
    );
  return (
    <main class="screen flow">
      <FlowBrand />
      <Back to={CHANNEL} said={f.emailLabel} />
      <FlowHeading eyebrow={f.quietInbox} title={f.stopTitle} lead={f.stopLead(to)} />
      <FlowArt art={FLOW.stop} />
      <FlowInfo title={f.listStays}>{f.stopWhy}</FlowInfo>
      <button type="button" class="btn btn--gone" disabled={busy} onClick={remove}>
        {busy ? t().common.loading : f.removeEmail}
      </button>
      <button type="button" class="btn btn--quiet" disabled={busy} onClick={() => go(CHANNEL)}>
        {f.keepEmail}
      </button>
      {failed && (
        <p class="flow__problem" role="alert">
          {f.networkFailed}
        </p>
      )}
    </main>
  );

  function remove() {
    return run(
      async (active) => {
        setFailed(false);
        const res = await post<{ ok: boolean }>('/api/stop', {});
        if (!active() || reseeded(res)) return;
        if (!res.ok) {
          setFailed(true);
          return;
        }
        const read = await reload();
        if (!active()) return;
        if (read && held()?.mail === null) setDone(true);
        else setFailed(true);
      },
      () => setFailed(true),
    );
  }
}
