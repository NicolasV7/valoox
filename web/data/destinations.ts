import { refused } from './channel.ts';
import type { Prefs } from './types.ts';

export const receiving = (prefs: Prefs | null): boolean =>
  !!prefs &&
  ((prefs.emailAvailable === true && prefs.mail?.ok === true && !refused(prefs.mail.said)) ||
    prefs.discord?.ok === true);

export function connectionState(connection: Prefs['discord']): {
  kind: 'ok' | 'bad' | 'wait';
  label: 'connected' | 'paused' | 'disconnected';
} {
  if (connection?.ok) return { kind: 'ok', label: 'connected' };
  return connection?.said === 'blocked'
    ? { kind: 'bad', label: 'paused' }
    : { kind: 'wait', label: 'disconnected' };
}
