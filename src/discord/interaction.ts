import { HttpError, readText } from '../lib/body.ts';
import { json } from '../lib/json.ts';
import * as discord from '../storage/discord.ts';
import { take } from '../storage/limits.ts';
import * as links from '../storage/links.ts';
import type { Env } from '../types.ts';
import { fingerprint } from '../vault/keys.ts';
import { CURRENT_KID } from '../vault/seal.ts';
import { snowflake } from './config.ts';
import { connect } from './connect.ts';
import { verify } from './signature.ts';
import type { Interaction } from './types.ts';
import { words } from './words.ts';

export async function interaction(
  req: Request,
  env: Env,
  ctx?: { waitUntil(task: Promise<unknown>): void },
): Promise<Response> {
  const headers = new Headers();
  if (req.method !== 'POST') return json({ error: 'method' }, headers, 405);
  try {
    const raw = await readText(req, 16384);
    if (!(await verify(req, raw, env.DISCORD_PUBLIC_KEY)))
      return json({ error: 'signature' }, headers, 401);
    let event: Interaction;
    try {
      event = JSON.parse(raw) as Interaction;
    } catch {
      throw new HttpError(400, 'invalid event');
    }
    if (!event || event.application_id !== env.DISCORD_APP_ID || !snowflake(env.DISCORD_APP_ID)) {
      return json({ error: 'application' }, headers, 401);
    }
    if (event.type === 1) return json({ type: 1 }, headers);
    const s = words(event.locale);
    const reply = (content: string) => json({ type: 4, data: { content, flags: 64 } }, headers);
    if (event.type !== 2) return reply(s.botUnknown);
    if (
      event.context !== 1 ||
      event.guild_id ||
      !snowflake(event.user?.id) ||
      !snowflake(event.channel_id) ||
      !snowflake(event.id) ||
      event.user?.bot
    )
      return reply(s.botPrivate);
    // Signature freshness alone does not prevent replay after a later reconnect.
    if (await take(env, 'discord-event:' + event.id, 1, 600)) return reply(s.botReceived);
    const recipient = await fingerprint(env, 'discord-user', event.user.id);
    if (event.data?.name !== 'stop' && (await take(env, 'discord-commands:' + recipient, 30, 60))) {
      return reply(s.botLimited);
    }
    if (event.data?.name === 'stop') {
      await discord.stop(env, recipient);
      return reply(s.botStopped);
    }
    if (event.data?.name === 'status') {
      return reply((await discord.connected(env, recipient)) ? s.botActive : s.botInactive);
    }
    if (event.data?.name !== 'connect') return reply(s.botUnknown);
    const code = event.data.options?.find((option) => option.name === 'code')?.value;
    if (typeof code !== 'string' || !/^[0-9a-f]{32}$/.test(code)) return reply(s.botInvalid);
    if (await take(env, 'discord-connect:' + recipient, 5, 3600)) return reply(s.botLimited);
    const key = await fingerprint(env, 'discord-link', code);
    const link = await links.claim(env, key, CURRENT_KID, event.id, recipient);
    if (!link) return reply(s.botInvalid);
    // Acknowledge before Discord's three-second deadline; no interaction token is stored.
    const task = connect(env, link, event);
    if (ctx) ctx.waitUntil(task);
    else await task;
    return reply(s.botReceived);
  } catch (e) {
    return json(
      { error: e instanceof HttpError ? e.message : 'retry' },
      headers,
      e instanceof HttpError ? e.status : 503,
    );
  }
}
