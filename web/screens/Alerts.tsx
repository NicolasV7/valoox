// The alerts tab.
//
// What it shows is decided by one call to our own Worker, and that is the
// whole point of the screen: everything here is ours. What you starred and
// where it would go live in our row, so neither waits on Riot and neither
// waits on the community catalogue. Only the renders do.
//
// Two states so far. The list with something in it is the next screen, and
// nothing in the app can put something in it yet — the star on a skin is a
// mark and not a control until the channel exists to send to.

import { useEffect, useState } from 'preact/hooks';
import * as api from '../data/api.ts';
import { NEEDS_RESEED } from '../data/api.ts';
import type { Prefs } from '../data/types.ts';
import { AlertsFirst } from './Alerts.first.tsx';
import { AlertsLoading } from './Alerts.loading.tsx';

export function Alerts() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => {
    let live = true;
    void api
      .prefs()
      .then((got) => {
        if (live && got !== NEEDS_RESEED) setPrefs(got);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (!prefs) return <AlertsLoading />;
  // The list with something in it is the next screen. Nothing in the app can
  // star anything yet, so an empty wishlist is the only state this can be in —
  // if one ever is not empty, that screen is what it needs, not this one.
  return <AlertsFirst channel={prefs.discord} starred={prefs.wishlist.length} />;
}
