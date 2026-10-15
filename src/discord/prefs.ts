import * as links from '../storage/links.ts';
import type { Env, Session } from '../types.ts';
import { CURRENT_KID } from '../vault/seal.ts';
import { configured } from './config.ts';

export async function preferences(env: Env, uid: string, s: Session) {
  const pending = await links.pending(env, uid, CURRENT_KID);
  return {
    discord: s.discord
      ? {
          name: s.discord.name,
          ok: s.discord.ok,
          said: s.discord.said ?? '',
        }
      : null,
    discordApp: configured(env) ? env.DISCORD_APP_ID : null,
    discordLink: pending ? { until: pending.expires * 1000, state: pending.state } : null,
  };
}
