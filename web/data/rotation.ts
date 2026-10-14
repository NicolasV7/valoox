import { expiresAt } from '../../src/lib/expiry.ts';
import type { StoreView } from './types.ts';

const BACKOFF = [2000, 5000, 15000, 60000];
const MAX_ATTEMPTS = 8;

export interface Rotation {
  changed(): void;
  stop(): void;
}

/** One scheduler for the whole store, including clocks on other screens. */
export function rotate(read: () => StoreView | null, refresh: () => Promise<void>): Rotation {
  let active = true;
  let busy = false;
  let timer = 0;
  let next = 0;
  let attempts = 0;

  const schedule = () => {
    clearTimeout(timer);
    const view = read();
    if (!active || !view || attempts >= MAX_ATTEMPTS) return;
    // Cap long waits: wall-clock changes and background throttling must not
    // leave a deadline tied to the clock that happened to schedule this timer.
    const delay = Math.min(60000, Math.max(0, expiresAt(view) - Date.now(), next - Date.now()));
    timer = window.setTimeout(wake, delay);
  };

  const wake = async () => {
    clearTimeout(timer);
    if (!active || busy || document.hidden || navigator.onLine === false) return;
    const view = read();
    if (!view) return;
    if (expiresAt(view) > Date.now()) {
      attempts = 0;
      next = 0;
      schedule();
      return;
    }
    if (attempts >= MAX_ATTEMPTS) return;
    if (Date.now() < next) return schedule();
    busy = true;
    try {
      await refresh();
    } catch {
      // The caller reports its failure; scheduling still needs to resume.
    } finally {
      busy = false;
      // A zero-duration response is still stale. Do not reset the retry delay
      // just because Riot answered, or it becomes a continuous request loop.
      const updated = read();
      if (updated && expiresAt(updated) > Date.now()) {
        attempts = 0;
        next = 0;
      } else {
        next = Date.now() + (BACKOFF[Math.min(attempts++, BACKOFF.length - 1)] as number);
      }
      schedule();
    }
  };

  document.addEventListener('visibilitychange', wake);
  for (const event of ['focus', 'online', 'pageshow']) window.addEventListener(event, wake);
  schedule();
  return {
    changed() {
      if (!active || busy) return;
      const view = read();
      if (view && expiresAt(view) > Date.now()) {
        attempts = 0;
        next = 0;
      }
      schedule();
    },
    stop() {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', wake);
      for (const event of ['focus', 'online', 'pageshow']) window.removeEventListener(event, wake);
    },
  };
}
