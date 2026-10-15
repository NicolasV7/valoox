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
    <ol class="discord__instructions">
      <li class="discord__command">
        <h3>{s.copyStep}</h3>
        <label class="flow__field" for="discord-command">
          <span class="label">{s.codeLabel}</span>
          <textarea id="discord-command" class="discord__code" readOnly rows={3} value={command} />
        </label>
        <div class="flow__bounds">
          <span>
            {s.codeTime}
            <Countdown from={until / 1000} since={0} />
          </span>
          <button type="button" class="btn btn--quiet" disabled={!enabled} onClick={copy}>
            {copied ? s.copied : s.copy}
          </button>
        </div>
        {failed && (
          <p class="flow__note" role="status">
            {s.copyFailed}
          </p>
        )}
      </li>
      {enabled && (
        <>
          <li>
            <h3>{s.openStep}</h3>
            <p>{s.openHelp}</p>
            <a
              class="btn"
              href={'https://discord.com/users/' + app}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.open}
            </a>
          </li>
          <li>
            <h3>{s.sendStep}</h3>
            <p>{s.sendStepHelp}</p>
          </li>
        </>
      )}
    </ol>
  );
}
