import { useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { FlowArt, FlowHeading, FlowInfo } from '../components/Flow.tsx';
import { useAction } from '../data/action.ts';
import * as api from '../data/api.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { go } from '../route.ts';

const ACCOUNT = { name: 'account' } as const;

export function AccountLeave({ onGone }: { onGone: () => void }) {
  const s = t().account;
  const f = t().flows;
  const { busy, run } = useAction();
  const [failed, setFailed] = useState(false);
  return (
    <main class="screen flow">
      <Back to={ACCOUNT} said={s.title} />
      <FlowHeading eyebrow={f.wayOut} title={f.leaveTitle} lead={f.leaveLead} />
      <FlowArt art={FLOW.disconnect} />
      <div class="flow__band">
        <h2>{f.removed}</h2>
      </div>
      <ul class="flow__removed">
        <li>{s.goesJar}</li>
        <li>{s.goesMail}</li>
        <li>{s.goesList}</li>
      </ul>
      <FlowInfo title={f.riotSeparate}>{f.separateWhy}</FlowInfo>
      <button type="button" class="btn btn--gone" disabled={busy} onClick={leave}>
        {busy ? t().common.loading : f.disconnect}
      </button>
      <button type="button" class="btn btn--quiet" disabled={busy} onClick={() => go(ACCOUNT)}>
        {f.stay}
      </button>
      <p class="flow__note">{f.confirmHere}</p>
      {failed && (
        <p class="flow__problem" role="alert">
          {s.leaveFailed}
        </p>
      )}
    </main>
  );

  function leave() {
    return run(
      async () => {
        setFailed(false);
        const result = await api.logout();
        if (api.reseeded(result)) return;
        if (!result.ok) throw new Error('logout');
        // Logout already invalidated this component's generation. The confirmed
        // result belongs to the shell, which shows the disconnected screen.
        onGone();
      },
      () => setFailed(true),
    );
  }
}
