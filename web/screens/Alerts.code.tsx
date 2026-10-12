import { useEffect, useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { spell, useLeft } from '../components/Countdown.tsx';
import { FlowArt, FlowHeading, FlowInfo } from '../components/Flow.tsx';
import { useAction } from '../data/action.ts';
import { reseeded } from '../data/api.ts';
import { again, prove, refused, reload, usePrefs, useWatch } from '../data/channel.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { ALERTS, go } from '../route.ts';
import { AlertsLoading } from './Alerts.loading.tsx';

export function AlertsCode() {
  const s = t().alerts;
  const f = t().flows;
  const prefs = usePrefs();
  const [code, setCode] = useState('');
  const [said, setSaid] = useState<string | null>(null);
  const [until, setUntil] = useState<number | null>(null);
  const { busy, run } = useAction();
  const wait = useLeft(until);
  const left = useLeft(prefs?.code?.until ?? null);
  const bad = refused(prefs?.mail?.said);
  const live = !!prefs?.mail && !prefs.mail.ok && !!prefs.code && prefs.code.tries > 0 && left > 0;
  // Poll only while a code is outstanding, including while this tab sleeps.
  useWatch(!!prefs?.mail && !prefs.mail.ok && !bad);
  useEffect(() => {
    if (bad || prefs?.mail?.ok) go(ALERTS);
  }, [bad, prefs?.mail?.ok]);

  if (!prefs) return <AlertsLoading step="code" />;
  return (
    <main class="screen flow">
      <Back to={{ name: 'alerts', step: 'channel' }} said={s.whereItGoes} />
      <FlowHeading
        eyebrow={f.finalStep}
        title={f.proofTitle}
        lead={prefs.mail?.to ? f.codeTo(prefs.mail.to) : f.noCode}
      />
      <FlowArt art={FLOW.proof} />
      <label class="flow__field" for="verification">
        <span class="label">{f.codeLabel}</span>
        <input
          id="verification"
          class="flow__code"
          type="text"
          inputMode="numeric"
          autocomplete="one-time-code"
          maxLength={6}
          value={code}
          disabled={busy || !live}
          onInput={(e) => {
            setCode(e.currentTarget.value.replace(/\D/g, '').slice(0, 6));
            setSaid(null);
          }}
        />
      </label>
      <div class="flow__bounds">
        <span>
          {f.codeTime}
          <span class="num" role="timer">
            {spell(left)}
          </span>
        </span>
        <span>{f.attempts(prefs.code?.tries ?? 0)}</span>
      </div>
      <button
        type="button"
        class="btn"
        disabled={!live || code.length !== 6 || busy}
        onClick={check}
      >
        {busy ? t().common.loading : f.verify}
      </button>
      {!live && (
        <>
          <p class="flow__note">{f.noCode}</p>
          <button
            type="button"
            class="btn btn--quiet"
            disabled={busy || wait > 0 || !prefs.mail}
            onClick={more}
          >
            {s.sendItAgain}
          </button>
        </>
      )}
      {(wait > 0 || said) && (
        <p class="flow__problem" role="alert">
          {wait > 0 ? s.waitSeconds(wait) : said}
        </p>
      )}
      <FlowInfo title={s.whatHappensAfter}>{f.proofWhy}</FlowInfo>
      <p class="flow__note">{s.tenAndFive}</p>
    </main>
  );

  function check() {
    return run(
      async (active) => {
        const res = await prove(code);
        if (!active() || reseeded(res)) return;
        if (res.ok) {
          const read = await reload();
          if (active()) {
            if (read) go(ALERTS);
            else setSaid(f.networkFailed);
          }
          return;
        }
        setCode('');
        await reload();
        if (!active()) return;
        setSaid(
          res.error === 'gone'
            ? s.codeGone
            : res.error === 'spent'
              ? s.codeSpent
              : res.error === 'wrong'
                ? s.codeWrong(res.left ?? 0)
                : f.networkFailed,
        );
      },
      () => setSaid(f.networkFailed),
    );
  }
  function more() {
    return run(
      async (active) => {
        const res = await again();
        if (!active() || reseeded(res)) return;
        setCode('');
        if (res.error === 'wait') return setUntil(Date.now() + (res.wait ?? 60) * 1000);
        await reload();
        if (!active()) return;
        if (res.error === 'bounced' || refused(res.said)) return go(ALERTS);
        if (!res.sent) setSaid(res.error === 'opened' ? s.alreadyThere : f.providerUnavailable);
      },
      () => setSaid(f.networkFailed),
    );
  }
}
