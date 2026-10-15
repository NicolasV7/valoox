import { Back } from '../components/Back.tsx';
import { FlowHeading, FlowInfo, FlowState } from '../components/Flow.tsx';
import { usePrefs } from '../data/channel.ts';
import { connectionState } from '../data/destinations.ts';
import { useDiscord } from '../data/discord.ts';
import { t } from '../i18n/index.ts';
import { ALERTS } from '../route.ts';
import { AlertsCommand } from './Alerts.command.tsx';
import { AlertsLoading } from './Alerts.loading.tsx';

export function AlertsDiscord() {
  const prefs = usePrefs();
  const flow = useDiscord(prefs);
  const s = t().discord;
  if (!prefs) return <AlertsLoading step="discord" />;
  const app = prefs.discordApp;
  const pending = prefs.discordLink;
  const state = connectionState(prefs.discord);
  const failed = pending?.state === 'blocked' || pending?.state === 'unavailable';
  const expired = !!flow.until && flow.left === 0;
  return (
    <main class="screen flow">
      <Back to={ALERTS} said={t().common.nav.alerts} />
      <FlowHeading eyebrow={s.name} title={s.title} lead={s.lead} />
      <section class="discord__identity" aria-live="polite">
        <span class="label">{s.name}</span>
        <h2>{prefs.discord?.name || s.connect}</h2>
        <FlowState kind={state.kind}>{s[state.label]}</FlowState>
      </section>
      {!app ? (
        <p class="flow__note">{s.notReady}</p>
      ) : (
        <>
          <p class="flow__note">{s.consent}</p>
          <a
            class="btn btn--quiet"
            href={
              'https://discord.com/oauth2/authorize?client_id=' +
              app +
              '&integration_type=1&scope=applications.commands'
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.install}
          </a>
          <a
            class="btn btn--quiet"
            href={'https://discord.com/users/' + app}
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.open}
          </a>
          <button
            type="button"
            class="btn"
            disabled={flow.busy || flow.wait > 0}
            onClick={flow.start}
          >
            {flow.busy ? t().common.loading : flow.until ? s.generateAgain : s.generate}
          </button>
          {flow.code && (
            <AlertsCommand
              key={flow.code.value}
              code={flow.code.value}
              until={flow.code.until}
              enabled={flow.left > 0 && !failed}
            />
          )}
          {(flow.code || pending) && (
            <p class="flow__note" role="status">
              {expired
                ? s.expired
                : failed
                  ? pending?.state === 'blocked'
                    ? s.blocked
                    : s.unavailable
                  : pending?.state === 'checking'
                    ? s.checking
                    : s.waiting}
            </p>
          )}
        </>
      )}
      {prefs.discord?.said === 'blocked' && <p class="flow__problem">{s.blocked}</p>}
      {(flow.problem || flow.wait > 0) && (
        <p class="flow__problem" role="alert">
          {flow.wait > 0
            ? s.waitSeconds(flow.wait)
            : flow.problem === 'network'
              ? t().flows.networkFailed
              : s.unavailable}
        </p>
      )}
      {flow.removed && (
        <p class="flow__note" role="status">
          {s.removed}
        </p>
      )}
      <button type="button" class="btn btn--quiet" disabled={flow.busy} onClick={flow.refresh}>
        {s.refresh}
      </button>
      {(prefs.discord || pending || flow.code) && (
        <button type="button" class="btn btn--gone" disabled={flow.busy} onClick={flow.remove}>
          {s.remove}
        </button>
      )}
      <FlowInfo title={s.choose}>{s.both}</FlowInfo>
      <p class="flow__note">{s.proof}</p>
      <p class="flow__note">{s.permission}</p>
      <p class="flow__note">{s.private}</p>
    </main>
  );
}
