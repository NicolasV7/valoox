import { usePrefs } from '../data/channel.ts';
import { AlertsChannel } from './Alerts.channel.tsx';
import { AlertsCode } from './Alerts.code.tsx';
import { AlertsDiscord } from './Alerts.discord.tsx';
import { AlertsLoading } from './Alerts.loading.tsx';
import { AlertsRemove } from './Alerts.remove.tsx';

/** Retained email screens stay unreachable while the server disables the feature. */
export function AlertsMail({ step }: { step: 'channel' | 'code' | 'remove' }) {
  const prefs = usePrefs();
  if (!prefs) return <AlertsLoading step="discord" />;
  if (!prefs.emailAvailable) return <AlertsDiscord />;
  if (step === 'channel') return <AlertsChannel />;
  if (step === 'code') return <AlertsCode />;
  return <AlertsRemove />;
}
