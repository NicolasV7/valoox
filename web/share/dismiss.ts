import { useLayoutEffect, useRef, useState } from 'preact/hooks';

/** Reverse the actual entry progress; a quick dismissal must not flash a fully open panel. */
export function leave(node: HTMLDialogElement | null, done: () => void): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const visibility = () => {
    if (document.hidden) finish();
  };
  const cancel = () => {
    stopped = true;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', visibility);
  };
  const finish = () => {
    if (stopped) return;
    cancel();
    done();
  };
  try {
    const motions =
      typeof CSSAnimation === 'undefined'
        ? []
        : (node?.getAnimations({ subtree: true }) ?? []).filter(
            (a) =>
              a instanceof CSSAnimation &&
              ['share-open', 'share-dim'].includes(a.animationName) &&
              typeof a.currentTime === 'number' &&
              a.currentTime > 0,
          );
    if (document.hidden || !motions.length) finish();
    else {
      for (const motion of motions) {
        motion.reverse();
        motion.playbackRate = -1.25;
      }
      document.addEventListener('visibilitychange', visibility);
      // A cancelled effect, hidden tab or unavailable animation engine cannot trap the modal.
      timer = setTimeout(finish, 260);
      void Promise.allSettled(motions.map((a) => a.finished)).then(finish);
    }
  } catch {
    finish();
  }
  return cancel;
}

export function useDismiss(node: { current: HTMLDialogElement | null }, onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const locked = useRef(false);
  const close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    if (closing) return leave(node.current, () => close.current());
  }, [closing]);
  return {
    closing,
    dismiss: () => {
      if (locked.current) return;
      locked.current = true;
      setClosing(true);
    },
  };
}
