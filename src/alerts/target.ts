import { emailEnabled } from '../app/features.ts';
import type { Env, Session } from '../types.ts';

export type Channel = 'mail' | 'discord';
export const channels: Channel[] = ['mail', 'discord'];

export function target(s: Session, channel: Channel, env: Env): { to: string; gen: string } | null {
  if (channel === 'mail') {
    return emailEnabled(env) && s.mail?.ok && s.mail.gen
      ? { to: s.mail.to.toLowerCase(), gen: s.mail.gen }
      : null;
  }
  return s.discord?.ok ? { to: s.discord.user, gen: s.discord.gen } : null;
}
