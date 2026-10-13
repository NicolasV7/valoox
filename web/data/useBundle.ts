import { useEffect, useState } from 'preact/hooks';
import { bundle, type Piece } from './catalogue.ts';

/** New bundles can reach Riot's store before the public catalogue publishes them. */
export function useBundle(id: string): Piece | null | undefined {
  const [found, setFound] = useState<{ id: string; value: Piece | null | undefined }>({
    id,
    value: undefined,
  });
  useEffect(() => {
    let live = true;
    let busy = false;
    let done = false;
    let next = 0;
    let attempts = 0;
    let timer = 0;
    const read = async () => {
      clearTimeout(timer);
      if (!live || done || busy || document.hidden || navigator.onLine === false) return;
      if (Date.now() < next) {
        timer = window.setTimeout(read, next - Date.now());
        return;
      }
      busy = true;
      const value = await bundle(id);
      busy = false;
      if (!live) return;
      setFound({ id, value });
      done = !!(value && (value.icon || value.banner));
      if (!done) {
        next = Date.now() + Math.min(300000, 30000 * 2 ** Math.min(attempts++, 4));
        timer = window.setTimeout(read, next - Date.now());
      }
    };
    document.addEventListener('visibilitychange', read);
    window.addEventListener('online', read);
    void read();
    return () => {
      live = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', read);
      window.removeEventListener('online', read);
    };
  }, [id]);
  return found.id === id ? found.value : undefined;
}
