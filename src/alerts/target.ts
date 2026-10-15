import type { Session } from '../types.ts';

export type Channel = 'mail' | 'discord';
export const channels: Channel[] = ['mail', 'discord'];

export function target(s: Session, channel: Channel): { to: string; gen: string } | null {
  if (channel === 'mail') {
    return s.mail?.ok && s.mail.gen ? { to: s.mail.to.toLowerCase(), gen: s.mail.gen } : null;
  }
  return s.discord?.ok ? { to: s.discord.user, gen: s.discord.gen } : null;
}
