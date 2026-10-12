// Serialize full-list writes so rapid taps cannot save an older snapshot last.
import { useEffect, useState } from 'preact/hooks';
import * as api from './api.ts';
import { held, tell } from './channel.ts';
import { rememberWishlist } from './optimistic.ts';
import { current, epoch, listen } from './private.ts';
import type { Star } from './stars.ts';
import type { Prefs } from './types.ts';

let tail = Promise.resolve();
let count = 0;
let serial = 0;
let confirmed: Prefs['wishlist'] = [];
let failed = false;
const listeners = new Set<(value: boolean) => void>();
function failure(value: boolean) {
  failed = value;
  for (const fn of listeners) fn(value);
}
listen(() => {
  tail = Promise.resolve();
  count = 0;
  serial++;
  confirmed = [];
  failure(false);
});

export function saveWishlist(next: Star[]): Promise<void> {
  const was = held();
  if (!was) return Promise.resolve();
  const generation = epoch();
  const id = ++serial;
  if (!count) confirmed = was.wishlist;
  count++;
  failure(false);
  rememberWishlist(next);
  tell({ ...was, wishlist: next });
  const work = tail
    .then(async () => {
      if (!current(generation)) return;
      const got = await api.post<Prefs>('/api/prefs', { wishlist: next }).catch(() => null);
      if (!current(generation)) return;
      if (got && !api.reseeded(got) && Array.isArray(got.wishlist)) {
        confirmed = got.wishlist;
        if (id === serial) {
          rememberWishlist(null);
          const now = held();
          if (now) tell({ ...now, wishlist: confirmed });
        }
      } else if (id === serial) {
        const read = await api.prefs().catch(() => null);
        if (!current(generation) || id !== serial) return;
        rememberWishlist(null);
        if (read && !api.reseeded(read)) tell(read);
        else {
          const now = held();
          if (now) tell({ ...now, wishlist: confirmed });
        }
        failure(true);
      }
    })
    .finally(() => {
      if (current(generation)) count--;
    });
  tail = work;
  return work;
}

export function useWishlistError(): boolean {
  const [value, set] = useState(failed);
  useEffect(() => {
    listeners.add(set);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return value;
}
