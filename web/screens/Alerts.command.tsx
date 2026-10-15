import { useState } from 'preact/hooks';
import { Countdown } from '../components/Countdown.tsx';
import { t } from '../i18n/index.ts';

export function AlertsCommand({
  code,
  until,
  enabled,
  app,
}: {
  code: string;
  until: number;
  enabled: boolean;
  app: string;
}) {
  const s = t().discord;
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const command = s.command(code);
  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setFailed(true);
    }
  }
  return (
    <ol class="discord__instructions" aria-label={s.sendHelp}>
      <li class="discord__command">
        <div class="discord__action">
          <h3>{s.copyStep}</h3>
          <button type="button" class="btn btn--quiet" disabled={!enabled} onClick={copy}>
            {copied ? s.copied : s.copy}
          </button>
        </div>
        <textarea
          id="discord-command"
          aria-label={s.codeLabel}
          class="discord__code"
          readOnly
          rows={2}
          value={command}
        />
        <p class="discord__expiry">
          {s.codeTime}
          <Countdown from={until / 1000} since={0} />
        </p>
        {failed && (
          <p class="flow__note" role="status">
            {s.copyFailed}
          </p>
        )}
      </li>
      {enabled && (
        <li>
          <div class="discord__action">
            <h3>{s.openStep}</h3>
            <a
              class="btn"
              href={'https://discord.com/users/' + app}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.open}
            </a>
          </div>
          <p>{s.sendStepHelp}</p>
        </li>
      )}
    </ol>
  );
}
