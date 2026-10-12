import { stopLink } from '../routes/stop.ts';
import type { Env, Hit, Session } from '../types.ts';
import { mintStop } from '../vault/stop.ts';
import { html, subject, text } from './mail/alert.ts';
import { langOf, words } from './mail/words.ts';

export interface Outbox {
  uid: string;
  channel: 'mail' | 'discord';
  to: string;
  gen?: string;
  subject: string;
  html: string;
  text: string;
  until: number;
}
export async function build(
  env: Env,
  uid: string,
  s: Session,
  channel: 'mail' | 'discord',
  found: Hit[],
  left: number,
): Promise<Outbox> {
  const lang = langOf(s.mail?.lang);
  if (channel === 'discord')
    return {
      uid,
      channel,
      to: s.notify?.discord ?? '',
      subject: '',
      html: '',
      text: words[lang].pushLine(found.map((h) => h.name)),
      until: Date.now() + Math.min(left, 23 * 3600) * 1000,
    };
  const home = 'https://drop.valoox.store';
  const stop = stopLink(home, await mintStop(env, uid));
  return {
    uid,
    channel,
    to: s.mail?.to ?? '',
    gen: s.mail?.gen,
    subject: subject(found, lang, s.name),
    html: html(found, left, lang, home, stop, s.name, s.mail?.tz),
    text: text(found, lang, stop),
    until: Date.now() + Math.min(left, 23 * 3600) * 1000,
  };
}
