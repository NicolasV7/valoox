import { useEffect, useRef, useState } from 'preact/hooks';
import { current, epoch } from '../data/private.ts';
import { t } from '../i18n/index.ts';
import { live, type Snapshot } from './model.ts';
import { native, save, share } from './transport.ts';

export function ShareActions({
  file,
  source,
  onBusy,
}: {
  file: File | null;
  source: Snapshot;
  onBusy: (busy: boolean) => void;
}) {
  const s = t().share;
  const owner = useRef(epoch());
  const mounted = useRef(true);
  const locked = useRef(false);
  const release = useRef<(() => void) | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<'share' | 'save' | null>(null);
  const supported = !!file && native(file);
  const active = () => mounted.current && current(owner.current) && live(source);

  useEffect(
    () => () => {
      mounted.current = false;
      release.current?.();
    },
    [],
  );
  useEffect(() => {
    setFailed(null);
    release.current?.();
    release.current = null;
  }, [file]);

  function download() {
    if (!file || locked.current || !active()) return;
    try {
      release.current?.();
      release.current = save(file);
      setFailed(null);
    } catch {
      setFailed('save');
    }
  }

  function send() {
    if (!file || locked.current || !active()) return;
    if (!supported) return download();
    locked.current = true;
    setBusy(true);
    onBusy(true);
    setFailed(null);
    // Nothing is awaited before this call: the tap's activation is still live.
    void share(file)
      .catch(() => {
        if (active()) setFailed('share');
      })
      .finally(() => {
        locked.current = false;
        if (mounted.current) {
          setBusy(false);
          onBusy(false);
        }
      });
  }

  return (
    <div class="share__actions">
      <button type="button" class="btn" disabled={!file || busy} onClick={send}>
        {busy ? s.sending : file && !supported ? s.save : s.send}
      </button>
      {failed && (
        <p class="small" role="alert">
          {failed === 'share' ? s.shareFailed : s.saveFailed}
        </p>
      )}
      {failed === 'share' && (
        <button type="button" class="btn btn--quiet" onClick={download}>
          {s.save}
        </button>
      )}
      {file && <p class="small">{supported ? s.nativeHelp : s.saveHelp}</p>}
    </div>
  );
}
