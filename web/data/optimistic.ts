// A background preference read must not undo a newer local wishlist edit.
import { listen } from './private.ts';
import type { Prefs } from './types.ts';

let wanted: Prefs['wishlist'] | null = null;
let version = 0;
export const wishlistVersion = () => version;
export function rememberWishlist(next: Prefs['wishlist'] | null) {
  wanted = next;
  version++;
}
listen(() => rememberWishlist(null));

export function protectWishlist(next: Prefs, previous?: Prefs | null, at = version): Prefs {
  const list = wanted ?? (at !== version && previous ? previous.wishlist : next.wishlist);
  return { ...next, wishlist: list };
}
