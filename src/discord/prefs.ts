import * as links from '../storage/links.ts';
import type { Env, Session } from '../types.ts';
import { fingerprint } from '../vault/keys.ts';
import { CURRENT_KID } from '../vault/seal.ts';
import { configured } from './config.ts';

export async function preferences(env: Env, uid: string, s: Session) {
  const pending = s.discord?.ok ? null : await links.pending(env, uid, CURRENT_KID);
  return {
    discord: s.discord
      ? {
          name: s.discord.name,
          ok: s.discord.ok,
          said: s.discord.said ?? '',
          lang: s.discord.lang,
          avatar: s.discord.ok
            ? '/api/discord/avatar?v=' +
              (await fingerprint(env, 'discord-avatar', s.discord.gen)).slice(0, 24)
            : null,
        }
      : null,
    discordApp: configured(env) ? env.DISCORD_APP_ID : null,
    discordLink: pending ? { until: pending.expires * 1000, state: pending.state } : null,
  };
}
