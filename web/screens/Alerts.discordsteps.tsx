import { t } from '../i18n/index.ts';

export function DiscordSteps({ current }: { current: number }) {
  const s = t().discord;
  return (
    <ol class="discord__steps" aria-label={s.steps}>
      {[s.stepInstall, s.stepSend, s.stepConfirm].map((label, index) => (
        <li
          key={label}
          aria-current={current === index + 1 ? 'step' : undefined}
          class={current > index + 1 ? 'discord__step--done' : ''}
        >
          <span class="num">{String(index + 1).padStart(2, '0')}</span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
