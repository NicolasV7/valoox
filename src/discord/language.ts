import { latest } from '../storage/discord.ts';
import * as links from '../storage/links.ts';
import type { Env } from '../types.ts';
import { fingerprint } from '../vault/keys.ts';
import { CURRENT_KID } from '../vault/seal.ts';
import { readSession } from '../vault/session.ts';
import { langOf } from './words.ts';

/** Call only after a signed private interaction identifies its Discord recipient. */
export async function language(env: Env, recipient: string, code?: unknown): Promise<'en' | 'es'> {
  if (typeof code === 'string' && /^[0-9a-f]{32}$/.test(code)) {
    const pending = await links.locale(
      env,
      await fingerprint(env, 'discord-link', code),
      CURRENT_KID,
    );
    if (pending) return langOf(pending.lang);
  }
  const link = await latest(env, recipient);
  const held = link ? await readSession(env, link.uid) : null;
  return langOf(held?.session.discord?.lang);
}
