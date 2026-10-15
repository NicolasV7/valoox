import { avatarHash, snowflake } from '../discord/config.ts';
import type { Connection } from '../discord/types.ts';
import { readBytes, readText } from '../lib/body.ts';
import type { Env } from '../types.ts';
import { rf } from './http.ts';

/** Public profile art for a previously proved recipient; no client-selected URL. */
export async function profile(env: Env, connection: Connection) {
  if (!snowflake(connection.user)) throw new Error('invalid avatar owner');
  let avatar = connection.avatar;
  let changed = false;
  if (avatar === undefined || !connection.avatarAt || Date.now() - connection.avatarAt > 86400000) {
    const response = await rf('https://discord.com/api/v10/users/' + connection.user, {
      headers: { Authorization: 'Bot ' + env.DISCORD_TOKEN },
    });
    if (!response.ok) throw new Error('profile unavailable');
    const user = JSON.parse(await readText(response, 16384)) as { id?: string; avatar?: unknown };
    if (user.id !== connection.user || !(user.avatar === null || avatarHash(user.avatar))) {
      throw new Error('invalid avatar profile');
    }
    avatar = user.avatar;
    changed = true;
  }
  const url = avatarHash(avatar)
    ? 'https://cdn.discordapp.com/avatars/' + connection.user + '/' + avatar + '.png?size=128'
    : 'https://cdn.discordapp.com/embed/avatars/' +
      ((BigInt(connection.user) >> 22n) % 6n) +
      '.png';
  const image = await rf(url, { headers: { Accept: 'image/png' } });
  if (!image.ok || image.headers.get('content-type')?.split(';')[0] !== 'image/png') {
    throw new Error('avatar unavailable');
  }
  return { data: await readBytes(image, 131072), avatar, changed };
}
