import { html, subject, text } from '../alerts/mail/code.ts';
import type { Lang } from '../alerts/mail/words.ts';
import { LIFE, mint } from '../alerts/otp.ts';
import { hold } from '../alerts/wait.ts';
import * as codes from '../storage/codes.ts';
import * as messages from '../storage/messages.ts';
import type { Env } from '../types.ts';
import { outranks, refused, send } from '../vault/mail.ts';
import { encoded, type Held, readSession, saveSession } from '../vault/session.ts';
import { mintStop } from '../vault/stop.ts';
import { stopLink } from './stop.ts';

export async function mail(
  env: Env,
  uid: string,
  held: Held,
  to: string,
  lang: Lang,
  origin: string,
  tz?: number,
) {
  const wait = await hold(env, uid, to, held.session.puuid);
  if (wait) return { error: 'wait', wait };
  const { code, until, held: otp } = await mint(env, uid, to);
  const keep = held.session.mail?.ok === true && held.session.mail.to === to;
  held.session.mail = { to, lang, tz, ok: keep, gen: otp.id, said: '' };
  if (!(await codes.reserve(env, uid, held.ver, await encoded(env, uid, held.session), otp))) {
    return { error: 'conflict', ok: false };
  }
  const home = origin.startsWith('https://') ? origin : 'https://drop.valoox.store';
  const stop = stopLink(home, await mintStop(env, uid));
  const sent = await send(
    env,
    to,
    subject(code, lang),
    html(code, LIFE.minutes, lang, home, stop, held.session.name, tz),
    text(code, LIFE.minutes, lang),
    { id: otp.id },
  );
  if (sent.id) await messages.bind(env, otp.id, sent.id);
  // Preserve a webhook that overtook this response, and never alter a new address.
  for (let retry = 0; retry < 3; retry++) {
    const current = await readSession(env, uid);
    if (!current?.session.mail || current.session.mail.gen !== otp.id) break;
    const was = current.session.mail;
    const said = outranks(was.said ?? '', sent.said) && was.said ? was.said : sent.said;
    current.session.mail = {
      ...was,
      send: sent.id ?? was.send,
      said,
      ok: refused(said) ? false : was.ok,
    };
    if (await saveSession(env, uid, current.session, current.ver)) break;
  }
  // Timeouts are ambiguous: the provider may have accepted the message.
  if (!sent.ok && sent.status >= 400 && sent.status < 500) await codes.clear(env, uid, otp.id);
  return { to, ok: keep, said: sent.said, status: sent.status, until, sent: sent.ok };
}
