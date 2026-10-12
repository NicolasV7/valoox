import { stopLink } from '../routes/stop.ts';
import type { Env, Hit, Session } from '../types.ts';
import { mintStop } from '../vault/stop.ts';
import { html, subject, text } from './mail/alert.ts';
import { langOf } from './mail/words.ts';

export interface Outbox {
  uid: string;
  channel: 'mail';
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
  found: Hit[],
  left: number,
): Promise<Outbox> {
  const lang = langOf(s.mail?.lang);
  const home = 'https://drop.valoox.store';
  const stop = stopLink(home, await mintStop(env, uid));
  return {
    uid,
    channel: 'mail',
    to: s.mail?.to ?? '',
    gen: s.mail?.gen,
    subject: subject(found, lang, s.name),
    html: html(found, left, lang, home, stop, s.name, s.mail?.tz),
    text: text(found, lang, stop),
    until: Date.now() + Math.min(left, 23 * 3600) * 1000,
  };
}
