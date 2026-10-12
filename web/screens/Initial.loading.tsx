import type { Route } from '../route.ts';
import { AccountLoading } from './Account.loading.tsx';
import { AlertsLoading } from './Alerts.loading.tsx';
import { StoreLoading } from './Store.loading.tsx';

/** A cold link keeps its section's visual identity while authentication loads. */
export function InitialLoading({ route }: { route: Route }) {
  if (route.name === 'account') return <AccountLoading />;
  if (route.name === 'alerts') {
    return <AlertsLoading step={route.step === 'remove' ? 'channel' : (route.step ?? 'list')} />;
  }
  return <StoreLoading />;
}
