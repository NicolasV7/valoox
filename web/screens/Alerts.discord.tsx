import { Back } from '../components/Back.tsx';
import { FlowHeading, FlowInfo } from '../components/Flow.tsx';
import { usePrefs } from '../data/channel.ts';
import { useDiscord } from '../data/discord.ts';
import { t } from '../i18n/index.ts';
import { ALERTS } from '../route.ts';
import { DiscordReady } from './Alerts.discordready.tsx';
import { DiscordSetup } from './Alerts.discordsetup.tsx';
import { AlertsLoading } from './Alerts.loading.tsx';

export function AlertsDiscord() {
  const prefs = usePrefs();
  const flow = useDiscord(prefs);
  const s = t().discord;
  if (!prefs) return <AlertsLoading step="discord" />;
  const connected = prefs.discord?.ok === true && !prefs.discordLink;
  return (
    <main class="screen flow discord">
      <Back to={ALERTS} said={t().common.nav.alerts} />
      <FlowHeading
        eyebrow={s.name}
        title={connected ? s.readyTitle : s.title}
        lead={connected ? (prefs.wishlist.length ? s.readyLead : s.readyEmpty) : s.lead}
      />
      {connected ? (
        <DiscordReady prefs={prefs} flow={flow} />
      ) : prefs.discordApp ? (
        <DiscordSetup prefs={prefs} flow={flow} />
      ) : (
        <p class="flow__note">{prefs.emailAvailable ? s.notReady : s.notReadyDiscord}</p>
      )}
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
          {prefs.emailAvailable ? s.removed : s.removedDiscord}
        </p>
      )}
      {prefs.emailAvailable ? (
        <details class="discord__details">
          <summary>{s.choose}</summary>
          <FlowInfo title={s.choose}>{s.both}</FlowInfo>
          <p class="flow__note">{s.private}</p>
        </details>
      ) : (
        <p class="flow__note">{s.private}</p>
      )}
    </main>
  );
}
