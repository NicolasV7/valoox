import { useState } from 'preact/hooks';
import { FlowStep } from '../components/Flow.tsx';
import type { DiscordFlow } from '../data/discord.ts';
import type { Prefs } from '../data/types.ts';
import { t } from '../i18n/index.ts';
import { AlertsCommand } from './Alerts.command.tsx';
import { DiscordSteps } from './Alerts.discordsteps.tsx';

export function DiscordSetup({ prefs, flow }: { prefs: Prefs; flow: DiscordFlow }) {
  const [added, setAdded] = useState(false);
  const s = t().discord;
  const pending = prefs.discordLink;
  const failed = pending?.state === 'blocked' || pending?.state === 'unavailable';
  const expired = !!flow.until && flow.left === 0;
  const current = flow.checking ? 3 : flow.until || added ? 2 : 1;
  const install =
    'https://discord.com/oauth2/authorize?client_id=' +
    prefs.discordApp +
    '&integration_type=1&scope=applications.commands';
  return (
    <>
      <DiscordSteps current={current} />
      {current === 1 ? (
        <section class="discord__stage">
          <FlowStep number={1} title={s.stepInstall}>
            {s.installHelp}
          </FlowStep>
          <a class="btn" href={install} target="_blank" rel="noopener noreferrer">
            {s.install}
          </a>
          <button
            type="button"
            class="btn btn--quiet"
            disabled={flow.locked || flow.wait > 0}
            onClick={() => {
              setAdded(true);
              void flow.start();
            }}
          >
            {s.installed}
          </button>
        </section>
      ) : flow.checking ? (
        <section class="discord__stage" role="status" aria-busy="true">
          <FlowStep number={3} title={s.checking}>
            {s.checkingHelp}
          </FlowStep>
        </section>
      ) : (
        <section class="discord__stage">
          <FlowStep number={2} title={s.stepSend}>
            {s.sendHelp}
          </FlowStep>
          {flow.code && (
            <AlertsCommand
              key={flow.code.value}
              code={flow.code.value}
              until={flow.code.until}
              enabled={flow.left > 0 && !failed && !flow.locked}
            />
          )}
          {!expired && !failed && flow.code && (
            <a
              class="btn"
              href={'https://discord.com/users/' + prefs.discordApp}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.open}
            </a>
          )}
          <p class="flow__note" role="status">
            {expired
              ? s.expired
              : failed
                ? pending?.state === 'blocked'
                  ? s.blocked
                  : s.unavailable
                : flow.code
                  ? s.automatic
                  : s.resume}
          </p>
          {(!flow.code || expired || failed) && (
            <button
              type="button"
              class="btn"
              disabled={flow.locked || flow.wait > 0}
              onClick={flow.start}
            >
              {flow.busy ? t().common.loading : flow.until ? s.generateAgain : s.generate}
            </button>
          )}
          <details class="discord__details">
            <summary>{s.stepInstall}</summary>
            <p class="flow__note">{s.installHelp}</p>
            <a class="btn btn--quiet" href={install} target="_blank" rel="noopener noreferrer">
              {s.install}
            </a>
          </details>
        </section>
      )}
    </>
  );
}
