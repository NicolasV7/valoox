// Keep a late response from changing a screen or account that has been left.
import { useEffect, useRef, useState } from 'preact/hooks';
import { current, epoch } from './private.ts';

export function useAction() {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  async function run(work: (active: () => boolean) => Promise<void>, failed: () => void) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    const generation = epoch();
    const active = () => mounted.current && current(generation);
    try {
      await work(active);
    } catch {
      if (active()) failed();
    } finally {
      locked.current = false;
      if (active()) setBusy(false);
    }
  }
  return { busy, run };
}
