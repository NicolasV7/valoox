// The alerts tab.
//
// What it shows is decided by one call to our own Worker, and that is the
// whole point of the screen: everything here is ours. What you starred and
// where it would go live in our row, so neither waits on Riot and neither
// waits on the community catalogue. Only the renders do.

import { refused, usePrefs } from '../data/channel.ts';
import type { StoreView } from '../data/types.ts';
import { AlertsFailed } from './Alerts.failed.tsx';
import { AlertsFirst } from './Alerts.first.tsx';
import { AlertsLoading } from './Alerts.loading.tsx';
import { AlertsWorking } from './Alerts.working.tsx';

export function Alerts({ view }: { view: StoreView }) {
  const prefs = usePrefs();

  if (!prefs) return <AlertsLoading />;
  // Keep the working list available when the other destination can still receive.
  if (prefs.emailAvailable && refused(prefs.mail?.said) && !prefs.discord?.ok)
    return <AlertsFailed />;
  // Nothing starred is a different screen, not an empty one: there are two
  // things to do first and they have an order, which a list with no rows in
  // it cannot show.
  if (prefs.wishlist.length === 0) {
    return <AlertsFirst prefs={prefs} />;
  }
  return <AlertsWorking prefs={prefs} view={view} />;
}
