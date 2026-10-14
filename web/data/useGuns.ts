// The names of the few weapons carrying a charm.
//
// One small request each rather than the 430 KB weapons index: the buddies tab
// needs a gun's name only for the ones something is hanging off, which on this
// account is two. catalogue.ts remembers every answer for the life of the page,
// so opening the collection afterwards costs nothing extra.

import { gun } from './catalogue.ts';
import { useResource } from './resource.ts';

export function useGuns(ids: string[]): Record<string, string> {
  const key = [...new Set(ids)].sort().join();
  const names = useResource('guns:' + key, async () => {
    if (!key) return {};
    const pairs = await Promise.all(
      key.split(',').map((id) => gun(id).then((p) => [id, p?.name ?? ''] as const)),
    );
    return Object.fromEntries(pairs);
  });
  return names ?? {};
}
