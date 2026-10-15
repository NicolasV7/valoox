import * as links from '../storage/links.ts';
import type { Env } from '../types.ts';
import { send } from '../vault/discord.ts';
import { encoded, readSession } from '../vault/session.ts';
import { avatarHash } from './config.ts';
import { message } from './message.ts';
import type { Interaction } from './types.ts';
import { langOf } from './words.ts';

/** The provider test is sent once, then concurrent preference writes get a bounded CAS retry. */
export async function connect(env: Env, link: links.Link, event: Interaction): Promise<void> {
  try {
    const held = await readSession(env, link.uid);
    if (!held || held.kid !== link.kid) return;
    const report = await send(
      env,
      event.channel_id as string,
      message(langOf(link.lang), 'botTest'),
      link.gen,
    );
    if (!report.ok) {
      await links.failed(env, link, report.blocked ? 'blocked' : 'unavailable');
      return;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await readSession(env, link.uid);
      if (!current || current.kid !== link.kid) return;
      current.session.discord = {
        user: event.user?.id as string,
        room: event.channel_id as string,
        name: (event.user?.global_name || event.user?.username || event.user?.id || '')
          .replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, ' ')
          .slice(0, 80),
        gen: link.gen,
        ok: true,
        avatar: avatarHash(event.user?.avatar)
          ? event.user.avatar
          : event.user?.avatar === null
            ? null
            : undefined,
        avatarAt:
          event.user?.avatar === null || avatarHash(event.user?.avatar) ? Date.now() : undefined,
        lang: langOf(link.lang),
      };
      if (
        await links.complete(env, link, current.ver, await encoded(env, link.uid, current.session))
      )
        return;
    }
    await links.failed(env, link, 'unavailable');
  } catch {
    await links.failed(env, link, 'unavailable').catch(() => undefined);
  }
}
