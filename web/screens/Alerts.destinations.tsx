import { DiscordAvatar } from '../components/DiscordAvatar.tsx';
import { FlowRow, FlowState } from '../components/Flow.tsx';
import { refused, waiting } from '../data/channel.ts';
import { connectionState } from '../data/destinations.ts';
import type { Prefs } from '../data/types.ts';
import { t } from '../i18n/index.ts';
import type { Whence } from '../route.ts';

export function AlertsDestinations({ prefs, from }: { prefs: Prefs | null; from?: Whence }) {
  const s = t().alerts;
  const bad = refused(prefs?.mail?.said);
  const mail = prefs?.mail;
  const coded = waiting(prefs);
  return (
    <>
      {prefs?.emailAvailable && (
        <FlowRow
          to={{ name: 'alerts', step: coded ? 'code' : 'channel' }}
          from={from}
          label={t().flows.emailAlerts}
          title={mail?.to || s.yourEmail}
          loading={!prefs}
          state={
            <FlowState kind={bad ? 'bad' : mail?.ok ? 'ok' : 'wait'}>
              {bad ? s.wasRefused : mail?.ok ? s.verified : coded ? s.oneIsOut : s.notVerified}
            </FlowState>
          }
        />
      )}
      <DiscordDestination prefs={prefs} from={from} />
    </>
  );
}

export function DiscordDestination({ prefs, from }: { prefs: Prefs | null; from?: Whence }) {
  const d = t().discord;
  const discord = prefs?.discord;
  const state = connectionState(discord);
  return (
    <FlowRow
      to={{ name: 'alerts', step: 'discord' }}
      from={from}
      label={d.name}
      title={discord?.name || d.connect}
      avatar={
        discord?.ok && discord.avatar ? (
          <DiscordAvatar key={discord.avatar} name={discord.name} src={discord.avatar} />
        ) : undefined
      }
      loading={!prefs}
      state={<FlowState kind={state.kind}>{d[state.label]}</FlowState>}
    />
  );
}
