import { useEffect } from 'preact/hooks';
import { freshen } from './channel.ts';

/** Refresh shared favourites and external Discord revocation when a person returns. */
export function usePrefsSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      if (!document.hidden && navigator.onLine !== false) freshen();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [enabled]);
}
