import * as discord from '../storage/discord.ts';
import type { Env, Session } from '../types.ts';
import type { Budget } from '../vault/budget.ts';
import { send } from '../vault/discord.ts';
import type { DiscordOutbox } from './types.ts';

export async function deliver(
  env: Env,
  id: string,
  body: DiscordOutbox,
  s: Session,
  budget?: Budget,
): Promise<{ ok: boolean; wait?: number }> {
  if (s.discord?.room !== body.room) return { ok: true };
  const report = await send(env, body.room, body.message, id, budget, true);
  if (report.blocked) await discord.blocked(env, body.uid, body.gen);
  return { ok: report.ok || !!report.terminal, wait: report.wait };
}
