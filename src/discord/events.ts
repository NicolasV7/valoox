import { HttpError, readText } from '../lib/body.ts';
import { stop } from '../storage/discord.ts';
import type { Env } from '../types.ts';
import { fingerprint } from '../vault/keys.ts';
import { snowflake } from './config.ts';
import { verify } from './signature.ts';

const acknowledge = () =>
  new Response(null, { status: 204, headers: { 'Content-Type': 'application/json' } });

/** App removal is a signed, timestamped revocation; an old retry cannot stop a new consent. */
export async function events(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  try {
    const raw = await readText(req, 16384);
    if (!(await verify(req, raw, env.DISCORD_PUBLIC_KEY)))
      return new Response(null, { status: 401 });
    const payload = JSON.parse(raw) as {
      version?: number;
      application_id?: string;
      type?: number;
      event?: { type?: string; timestamp?: string; data?: { user?: { id?: string } } };
    };
    if (payload.version !== 1 || payload.application_id !== env.DISCORD_APP_ID) {
      return new Response(null, { status: 401 });
    }
    if (payload.type === 0) return acknowledge();
    if (payload.type !== 1) return new Response(null, { status: 400 });
    if (payload.event?.type !== 'APPLICATION_DEAUTHORIZED') return acknowledge();
    const user = payload.event.data?.user?.id;
    const timestamp = payload.event.timestamp ?? '';
    const at = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(timestamp) ? timestamp : timestamp + 'Z');
    if (!snowflake(user) || !Number.isFinite(at) || at > Date.now() + 300000) {
      return new Response(null, { status: 400 });
    }
    await stop(env, await fingerprint(env, 'discord-user', user), at);
    return acknowledge();
  } catch (error) {
    return new Response(null, { status: error instanceof HttpError ? error.status : 503 });
  }
}
