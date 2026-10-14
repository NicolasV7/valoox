// Public catalogue state follows its lookup key. Private account data must use
// its own generation-bound stores instead of this optional public result cache.
import { useEffect, useState } from 'preact/hooks';

export function useResource<T>(
  key: string,
  load: () => Promise<T | null>,
  cache?: Map<string, unknown>,
): T | null {
  const [found, setFound] = useState<{ key: string; value: T | null }>({ key, value: null });

  useEffect(() => {
    if (cache?.has(key)) return;
    let live = true;
    void load()
      .then((value) => {
        cache?.set(key, value);
        if (live) setFound({ key, value });
      })
      .catch(() => {
        if (live) setFound({ key, value: null });
      });
    return () => {
      live = false;
    };
    // The key identifies the request; callers create fresh loader closures.
  }, [key, cache]);

  if (cache?.has(key)) return cache.get(key) as T | null;
  return found.key === key ? found.value : null;
}
