import { useState } from 'preact/hooks';
import { FlowArt, FlowBrand, FlowHeading, FlowState } from '../components/Flow.tsx';
import { useAction } from '../data/action.ts';
import { reseeded } from '../data/api.ts';
import { again, reload, usePrefs } from '../data/channel.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { go, href, intercept } from '../route.ts';

const CHANNEL = { name: 'alerts', step: 'channel' } as const;

export function AlertsFailed() {
  const s = t().alerts;
  const f = t().flows;
  const prefs = usePrefs();
  const { busy, run } = useAction();
  const [error, setError] = useState<string | null>(null);
  const said = prefs?.mail?.said;
  const blocked = said === 'email.suppressed';
  const bounced = said === 'email.bounced' || said === 'email.complained';
  const word = blocked ? s.wasBlocked : bounced ? s.wasBounced : s.wasRefused;
  return (
    <main class="screen flow">
      <FlowBrand />
      <FlowHeading
        eyebrow={f.attention}
        title={word}
        lead={blocked ? s.blockedLede : bounced ? s.bouncedLede : s.refusedLede}
      />
      <FlowArt art={FLOW.bounced} />
      <div class="flow__problem">
        <FlowState kind="bad">{word}</FlowState>
        <strong>{prefs?.mail?.to}</strong>
        <p>{blocked ? s.blockedWhy : bounced ? s.bouncedWhy : s.refusedWhy}</p>
      </div>
      {!blocked && !bounced && (
        <button type="button" class="btn" disabled={busy} onClick={more}>
          {busy ? t().common.loading : s.sendAnother}
        </button>
      )}
      <a class="btn btn--quiet" href={href(CHANNEL)} onClick={intercept(CHANNEL)}>
        {s.editAddress}
      </a>
      {error && (
        <p class="flow__problem" role="alert">
          {error}
        </p>
      )}
      <p class="flow__note">{f.providerLimits}</p>
    </main>
  );

  function more() {
    return run(
      async (active) => {
        setError(null);
        const res = await again();
        if (!active() || reseeded(res)) return;
        const read = await reload();
        if (!active()) return;
        if (read && res.sent) return go({ name: 'alerts', step: 'code' });
        setError(res.error === 'wait' ? s.waitSeconds(res.wait ?? 60) : f.providerUnavailable);
      },
      () => setError(f.networkFailed),
    );
  }
}
