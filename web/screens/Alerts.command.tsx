import { useState } from 'preact/hooks';
import { Countdown } from '../components/Countdown.tsx';
import { t } from '../i18n/index.ts';

export function AlertsCommand({
  code,
  until,
  enabled,
}: {
  code: string;
  until: number;
  enabled: boolean;
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
    <section class="discord__command">
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
    </section>
  );
}
