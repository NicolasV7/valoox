import { useState } from 'preact/hooks';
import { DiscordAvatar } from '../components/DiscordAvatar.tsx';
import { FlowState } from '../components/Flow.tsx';
import type { DiscordFlow } from '../data/discord.ts';
import type { Prefs } from '../data/types.ts';
import { t } from '../i18n/index.ts';
import { ALERTS, href, intercept } from '../route.ts';

export function DiscordReady({ prefs, flow }: { prefs: Prefs; flow: DiscordFlow }) {
  const [confirm, setConfirm] = useState(false);
  const s = t().discord;
  return (
    <>
      <section class="discord__identity discord__identity--ready" aria-live="polite">
        <DiscordAvatar
          key={prefs.discord?.avatar}
          name={prefs.discord?.name ?? ''}
          src={prefs.discord?.avatar}
        />
        <span class="label">{s.name}</span>
        <h2>{prefs.discord?.name}</h2>
        <FlowState kind="ok">{s.connected}</FlowState>
      </section>
      <a class="btn" href={href(ALERTS)} onClick={intercept(ALERTS)}>
        {s.done}
      </a>
      <details class="discord__details">
        <summary>{s.manage}</summary>
        {confirm ? (
          <div class="discord__confirm">
            <h2>{s.removeTitle}</h2>
            <p class="flow__note">{prefs.emailAvailable ? s.removeWhy : s.removeWhyDiscord}</p>
            <button
              type="button"
              class="btn btn--gone"
              disabled={flow.locked}
              onClick={flow.remove}
            >
              {flow.busy ? t().common.loading : s.removeConfirm}
            </button>
            <button
              type="button"
              class="btn btn--quiet"
              disabled={flow.locked}
              onClick={() => setConfirm(false)}
            >
              {s.cancel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            class="btn btn--quiet"
            disabled={flow.locked}
            onClick={() => setConfirm(true)}
          >
            {s.remove}
          </button>
        )}
      </details>
    </>
  );
}
