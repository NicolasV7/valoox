import { configured } from '../discord/config.ts';
import { langOf } from '../discord/words.ts';
import { readJson } from '../lib/body.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import * as discord from '../storage/discord.ts';
import { take } from '../storage/limits.ts';
import * as links from '../storage/links.ts';
import { now } from '../storage/rows.ts';
import { fingerprint } from '../vault/keys.ts';
import { CURRENT_KID } from '../vault/seal.ts';
import { encoded, readSession, saveSession } from '../vault/session.ts';

export async function setDiscord({ env, uid, req }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const body = await readJson(req, 1024);
  const pending = await links.pending(env, uid, CURRENT_KID);
  if (pending?.state === 'checking') return { error: 'checking' };
  if (body.action === 'language') {
    if (!held.session.discord?.ok) return { error: 'disconnected' };
    const lang = langOf(body.lang);
    if (held.session.discord.lang === lang) return { ok: true };
    held.session.discord = { ...held.session.discord, lang };
    return (await saveSession(env, uid, held.session, held.ver))
      ? { ok: true }
      : { error: 'conflict' };
  }
  if (body.action === 'remove') {
    delete held.session.discord;
    const ok = await discord.remove(env, uid, held.ver, await encoded(env, uid, held.session));
    return ok ? { ok: true } : { error: 'conflict' };
  }
  if (body.action !== 'start') return { error: 'action' };
  if (held.session.discord?.ok) return { connected: true };
  if (!configured(env)) return { error: 'unavailable' };
  const wait = await take(env, 'discord-link:' + uid, 1, 60);
  if (wait) return { error: 'wait', wait };
  const cap = await take(env, 'discord-links:' + uid, 5, 3600);
  if (cap) return { error: 'wait', wait: cap };
  const code = crypto.randomUUID().replace(/-/g, '');
  const expires = now() + 600;
  const ok = await links.reserve(
    env,
    {
      uid,
      key: await fingerprint(env, 'discord-link', code),
      gen: crypto.randomUUID(),
      kid: CURRENT_KID,
      expires,
      claim: null,
      recipient: null,
      state: 'waiting',
      lang: langOf(body.lang),
    },
    held.ver,
  );
  return ok ? { code, until: expires * 1000 } : { error: 'conflict' };
}
