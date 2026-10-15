import { snowflake } from '../discord/config.ts';
import type { Message } from '../discord/types.ts';
import { hold, remaining } from '../storage/cooldowns.ts';
import { take } from '../storage/limits.ts';
import type { Env } from '../types.ts';
import type { Budget } from './budget.ts';
import { rf } from './http.ts';
import { fingerprint } from './keys.ts';

export interface Sent {
  ok: boolean;
  blocked?: boolean;
  terminal?: boolean;
  wait?: number;
}

/** One HTTP attempt; a cron retry must respect shared provider cooldowns. */
export async function send(
  env: Env,
  room: string,
  message: Message,
  id: string,
  budget?: Budget,
  delivery = false,
): Promise<Sent> {
  if (!env.DISCORD_TOKEN || !snowflake(room)) return { ok: false, terminal: !snowflake(room) };
  const bucket = 'discord-room:' + (await fingerprint(env, 'discord-room', room));
  const wait = Math.max(await remaining(env, bucket), await remaining(env, 'discord-global'));
  if (wait) return { ok: false, wait };
  if (delivery && (await take(env, 'discord-delivery:' + id, 4, 86400))) {
    return { ok: false, terminal: true };
  }
  try {
    const response = await rf('https://discord.com/api/v10/channels/' + room + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bot ' + env.DISCORD_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...message,
        allowed_mentions: { parse: [] },
        nonce: id.slice(0, 25),
        enforce_nonce: true,
      }),
      signal: AbortSignal.timeout(8000),
      budget,
    });
    if (response.ok) {
      const body = (await response.json().catch(() => null)) as { id?: string } | null;
      return { ok: snowflake(body?.id) };
    }
    if (response.status === 429) {
      const body = (await response.json().catch(() => null)) as {
        retry_after?: number;
        global?: boolean;
      } | null;
      const proposed = Number(body?.retry_after ?? response.headers.get('Retry-After'));
      const delay = Number.isFinite(proposed) && proposed > 0 ? Math.ceil(proposed) : 60;
      const global = body?.global || response.headers.get('X-RateLimit-Global') === 'true';
      await hold(env, global ? 'discord-global' : bucket, delay);
      return { ok: false, wait: delay };
    }
    if (response.status === 401) {
      await hold(env, 'discord-global', 900);
      return { ok: false, wait: 900 };
    }
    return {
      ok: false,
      blocked: response.status === 403 || response.status === 404,
      terminal: response.status >= 400 && response.status < 500,
    };
  } catch {
    // Timeout outcomes are ambiguous; a retry uses the same bounded nonce.
    return { ok: false };
  }
}
