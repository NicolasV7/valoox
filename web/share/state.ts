import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { current, epoch, listen } from '../data/private.ts';
import { type Format, live, type Snapshot } from './model.ts';
import { clear, type Picture, prepare } from './prepare.ts';

type State =
  | { key: object; at: 'loading' | 'failed' | 'stale' }
  | { key: object; at: 'ready'; picture: Picture };

export function usePoster(source: Snapshot, format: Format, tag: boolean, attempt: number) {
  const owner = useRef(epoch());
  const key = useMemo(() => ({ source, format, tag, attempt }), [source, format, tag, attempt]);
  const [state, setState] = useState<State>({ key, at: 'loading' });
  const active = () => current(owner.current) && live(source);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    let held: Picture | null = null;
    const invalidate = () => {
      controller.abort();
      if (held) clear(held.canvas);
      held = null;
      if (mounted) setState({ key, at: 'stale' });
    };
    const check = () => {
      if (!active()) invalidate();
    };
    const unlisten = listen(invalidate);
    const timer = setTimeout(
      invalidate,
      Math.min(2147483647, Math.max(0, source.until - Date.now())),
    );
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    setState({ key, at: 'loading' });
    if (!active()) invalidate();
    else
      void prepare(source, format, tag, controller.signal)
        .then((picture) => {
          if (!mounted || controller.signal.aborted || !active()) return clear(picture.canvas);
          held = picture;
          setState({ key, at: 'ready', picture });
        })
        .catch(() => {
          if (mounted && !controller.signal.aborted)
            setState({ key, at: active() ? 'failed' : 'stale' });
        });
    return () => {
      mounted = false;
      controller.abort();
      if (held) clear(held.canvas);
      clearTimeout(timer);
      unlisten();
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [key]);

  return { state: state.key === key ? state : { key, at: 'loading' as const }, active };
}
