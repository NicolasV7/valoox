import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../i18n/index.ts';
import { ShareActions } from './actions.tsx';
import { ShareLoading } from './loading.tsx';
import type { Format, Snapshot } from './model.ts';
import { Preview } from './preview.tsx';
import { usePoster } from './state.ts';

export function ShareDialog({ source, onClose }: { source: Snapshot; onClose: () => void }) {
  const s = t().share;
  const dialog = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<Format>('portrait');
  const [tag, setTag] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const { state, active } = usePoster(source, format, tag, attempt);
  const ready = state.at === 'ready' && active() ? state.picture : null;

  useLayoutEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => {
      node?.close();
    };
  }, []);

  return (
    <dialog
      class="share__dialog"
      ref={dialog}
      aria-labelledby="share-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div class="share__top">
        <button type="button" class="share__back" disabled={busy} onClick={onClose}>
          {s.back}
        </button>
        <span class="num share__dimensions">{s.dimensions(format === 'compact')}</span>
      </div>
      <h1 id="share-title">{s.title}</h1>
      <div class="share__options">
        <fieldset class="share__formats" aria-label={s.formats}>
          {(['portrait', 'compact'] as const).map((value) => (
            <button
              type="button"
              key={value}
              disabled={busy}
              aria-pressed={format === value}
              onClick={() => setFormat(value)}
            >
              {s[value]}
            </button>
          ))}
        </fieldset>
        <label class="share__tag">
          <input
            type="checkbox"
            checked={tag}
            disabled={busy}
            onChange={(event) => setTag(event.currentTarget.checked)}
          />
          {s.tag}
        </label>
      </div>
      <div class={'share__stage share__stage--' + format} aria-busy={state.at === 'loading'}>
        {ready ? (
          <Preview canvas={ready.canvas} />
        ) : state.at === 'loading' ? (
          <ShareLoading format={format} />
        ) : (
          <div class="share__placeholder">
            <p class="small" role="alert">
              {state.at === 'stale' ? s.stale : s.failed}
            </p>
          </div>
        )}
      </div>
      <footer class="share__foot">
        {(state.at === 'failed' || ready?.partial) && (
          <div class="share__recovery">
            {ready?.partial && (
              <p class="small" role="status">
                {s.partial}
              </p>
            )}
            <button
              type="button"
              class="share__back"
              disabled={busy}
              onClick={() => setAttempt((n) => n + 1)}
            >
              {s.retry}
            </button>
          </div>
        )}
        <ShareActions file={ready?.file ?? null} source={source} onBusy={setBusy} />
      </footer>
    </dialog>
  );
}
