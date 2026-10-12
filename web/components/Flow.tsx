import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route, type Whence } from '../route.ts';
import { Chevron } from './icons.tsx';

export function FlowHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <header class="flow__heading">
      <span class="label">{eyebrow}</span>
      <h1>
        {title}
        {!/[.?]$/.test(title) && (
          <span class="flow__dot" aria-hidden="true">
            .
          </span>
        )}
      </h1>
      {lead && <p>{lead}</p>}
    </header>
  );
}

/** Art keeps its dimensions when an asset cannot load. Its wash is measured. */
export function FlowArt({
  art,
  children,
  className = '',
}: {
  art: string;
  children?: ComponentChildren;
  className?: string;
}) {
  const colour = useArt(art);
  const [failed, setFailed] = useState(false);
  return (
    <div class={'flow__art stage ' + className} style={artStyle(colour)}>
      {children}
      <img
        class={failed ? 'flow__spray flow__spray--missing' : 'flow__spray'}
        src={art}
        alt=""
        width="180"
        height="180"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function FlowState({
  children,
  kind = 'wait',
}: {
  children: ComponentChildren;
  kind?: 'ok' | 'wait' | 'bad';
}) {
  return <span class={'flow__state flow__state--' + kind}>{children}</span>;
}

export function FlowInfo({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <div class="flow__info">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

export function FlowRow({
  to,
  from,
  label,
  title,
  detail,
  state,
  loading = false,
}: {
  to: Route;
  from?: Whence;
  label: string;
  title: string;
  detail?: string;
  state?: ComponentChildren;
  loading?: boolean;
}) {
  const content = (
    <>
      <span class="flow__row-copy">
        <span class="label">{label}</span>
        {loading ? <span class="flow__pending flow__pending--line" /> : <strong>{title}</strong>}
        {detail && <span class="small">{detail}</span>}
        {state}
      </span>
      <Chevron />
    </>
  );
  return loading ? (
    <div class="flow__row" aria-busy="true">
      {content}
    </div>
  ) : (
    <a class="flow__row" href={href(to)} onClick={intercept(to, from)}>
      {content}
    </a>
  );
}

export function FlowStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ComponentChildren;
}) {
  return (
    <div class="flow__step">
      <span class="num">{String(number).padStart(2, '0')}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function FlowRetry({ failed, retry }: { failed: boolean; retry: () => void }) {
  return failed ? (
    <div class="flow__problem" role="alert">
      <p>{t().flows.prefsFailed}</p>
      <button type="button" class="btn btn--quiet" onClick={retry}>
        {t().common.retry}
      </button>
    </div>
  ) : (
    <p class="flow__note" role="status">
      {t().common.loading}
    </p>
  );
}
