import type { Ctx } from '../lib/json.ts';
import { take } from '../storage/limits.ts';
import { profile } from '../vault/avatar.ts';
import { fingerprint } from '../vault/keys.ts';
import { readSession, saveSession } from '../vault/session.ts';

export async function avatar({ env, uid, req, headers }: Ctx): Promise<Response> {
  headers.set('Cache-Control', 'no-store');
  const held = await readSession(env, uid);
  const connection = held?.session.discord;
  if (!held || !connection?.ok) return new Response(null, { status: 404, headers });
  const version = (await fingerprint(env, 'discord-avatar', connection.gen)).slice(0, 24);
  if (new URL(req.url).searchParams.get('v') !== version)
    return new Response(null, { status: 404, headers });
  if (await take(env, 'discord-avatar:' + uid, 10, 60))
    return new Response(null, { status: 429, headers });
  try {
    const image = await profile(env, connection);
    if (image.changed) {
      held.session.discord = { ...connection, avatar: image.avatar, avatarAt: Date.now() };
      await saveSession(env, uid, held.session, held.ver);
    }
    const current = await readSession(env, uid);
    if (!current?.session.discord?.ok || current.session.discord.gen !== connection.gen) {
      return new Response(null, { status: 404, headers });
    }
    headers.set('Content-Type', 'image/png');
    headers.set('Cache-Control', 'private, max-age=3600');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(image.data, { headers });
  } catch {
    return new Response(null, { status: 404, headers });
  }
}
