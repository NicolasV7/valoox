import { useRef, useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { useLeft } from '../components/Countdown.tsx';
import { FlowArt, FlowHeading, FlowInfo, FlowState } from '../components/Flow.tsx';
import { useAction } from '../data/action.ts';
import { reseeded } from '../data/api.ts';
import { again, open, refused, reload, usePrefs, waiting } from '../data/channel.ts';
import { sameMailbox } from '../data/mailbox.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { ALERTS, go, href, intercept } from '../route.ts';
import { AlertsLoading } from './Alerts.loading.tsx';

const ADDRESS = /^[^\s@,;:<>"']{1,64}@[^\s@,;:<>"'.]{1,63}(\.[^\s@,;:<>"'.]{1,63})+$/;
const REMOVE = { name: 'alerts', step: 'remove' } as const;

export function AlertsChannel() {
  const s = t().alerts;
  const f = t().flows;
  const prefs = usePrefs();
  const [to, setTo] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [until, setUntil] = useState<number | null>(null);
  const { busy, run } = useAction();
  const wait = useLeft(until);
  const field = useRef<HTMLInputElement>(null);
  const now = to ?? prefs?.mail?.to ?? '';
  const here = sameMailbox(now, prefs?.mail?.to);
  const bad = refused(prefs?.mail?.said) && here;
  const ok = prefs?.mail?.ok === true && here && !bad;
  const typing = here && !ok && waiting(prefs);
  const valid = ADDRESS.test(now.trim()) && now.trim().length <= 254;

  if (!prefs) return <AlertsLoading step="channel" />;
  return (
    <main class="screen flow">
      <Back to={ALERTS} said={t().common.nav.alerts} />
      <FlowHeading eyebrow={f.destination} title={s.whereItGoes} lead={f.inboxLead} />
      <FlowArt art={FLOW.email} className="flow__mail">
        <div>
          <h2>{f.emailAlerts}</h2>
          <p>{f.codeFirst}</p>
        </div>
      </FlowArt>
      <label class="flow__field" for="addr">
        <span class="label">{f.emailLabel}</span>
        <input
          ref={field}
          id="addr"
          type="email"
          inputMode="email"
          autocomplete="email"
          spellcheck={false}
          value={now}
          maxLength={254}
          disabled={busy}
          placeholder={f.emailPlaceholder}
          onInput={(e) => {
            setTo(e.currentTarget.value);
            setSaid(null);
          }}
        />
      </label>
      {now.trim() && (
        <FlowState kind={bad ? 'bad' : ok ? 'ok' : 'wait'}>
          {bad ? s.wasRefused : ok ? s.verified : s.notVerified}
        </FlowState>
      )}
      {ok ? (
        <button
          type="button"
          class="btn btn--quiet"
          onClick={() => {
            field.current?.focus();
            field.current?.select();
          }}
        >
          {s.editAddress}
        </button>
      ) : typing ? (
        <button type="button" class="btn" onClick={() => go({ name: 'alerts', step: 'code' })}>
          {s.typeTheCode}
        </button>
      ) : (
        <button
          type="button"
          class="btn"
          disabled={!valid || busy || bad || wait > 0}
          onClick={start}
        >
          {busy ? t().common.loading : s.sendATest}
        </button>
      )}
      {(said || bad || wait > 0) && (
        <p class="flow__problem" role="alert">
          {wait > 0 ? s.waitSeconds(wait) : (said ?? s.changeIt)}
        </p>
      )}
      {typing && <p class="flow__note">{s.oneIsOut}</p>}
      <FlowInfo title={f.whyCode}>{f.proofWhy}</FlowInfo>
      <p class="flow__note">{f.changing}</p>
      <p class="flow__note">{s.sameInbox}</p>
      {prefs.mail && (
        <a class="flow__leave" href={href(REMOVE)} onClick={intercept(REMOVE)}>
          {f.removeEmail}
        </a>
      )}
    </main>
  );

  function start() {
    return run(
      async (active) => {
        setSaid(null);
        const address = now.trim();
        const out = address === prefs?.mail?.to ? await again() : await open(address);
        if (!active() || reseeded(out)) return;
        if (out.error === 'wait') return setUntil(Date.now() + (out.wait ?? 60) * 1000);
        if (out.error === 'address') return setSaid(s.badAddress);
        if (out.error === 'taken') return setSaid(s.taken);
        if (out.error === 'bounced') return setSaid(s.changeIt);
        if (out.error === 'opened') {
          await reload();
          if (active()) setSaid(s.alreadyThere);
          return;
        }
        if (!(await reload())) {
          if (active()) setSaid(f.networkFailed);
          return;
        }
        if (!active()) return;
        if (out.sent) return go({ name: 'alerts', step: 'code' });
        if (refused(out.said)) return go(ALERTS);
        setSaid(f.providerUnavailable);
      },
      () => setSaid(f.networkFailed),
    );
  }
}
