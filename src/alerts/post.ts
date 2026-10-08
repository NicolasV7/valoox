// One wishlist hit, out the door.
//
// Split from the job itself because the job is about not looking like
// credential stuffing, and this is about what a person receives. Two subjects
// that were sharing a file and are both shorter apart.
//
// Mail is the channel the product is built on and gets the designed message.
// Discord is still on the list and gets the plain line: a webhook takes text,
// and a webhook is a thing somebody set up on purpose. Either landing counts,
// because the only claim being made is that it went somewhere.

import { stopLink } from '../routes/stop.ts';
import type { Env, Hit, Session } from '../types.ts';
import { rf } from '../vault/http.ts';
import { send } from '../vault/mail.ts';
import { mintStop } from '../vault/stop.ts';
import { html, subject, text } from './mail/alert.ts';
import { langOf } from './mail/words.ts';

/** Where the pictures in a message come from and where its links point. The
 *  job has no request to read an origin off, so this is the one place in the
 *  app that writes the address down. */
const HOME = 'https://drop.valoox.store';

/**
 * One channel, with a bounded retry.
 *
 * A 5xx or a connection that never opens is worth another go; a 4xx is the
 * channel telling us the request is wrong, and it will stay wrong. The timeout
 * is the important half: ntfy used to hang 19 to 39 seconds before Cloudflare
 * gave up on it, and a notifier that blocks for a minute is its own outage.
 */
const TRIES = 3;
const TIMEOUT = 6000;

async function fire(url: string, init: RequestInit): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < TRIES; i++) {
    try {
      const res = await rf(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
      if (res.status < 500) return res;
      last = res;
    } catch {
      // Aborted, or the connection never opened. Neither is worth logging: the
      // status of the last attempt is the whole story.
    }
  }
  // Ours, not the channel's: every attempt timed out before anything answered.
  return last ?? new Response(null, { status: 504 });
}

/** The one line a channel with no layout gets. */
export function message(found: Hit[]): string {
  const names = found.map((h) => h.name);
  return names.length === 1
    ? names[0] + ' está en tu tienda hoy.'
    : names.join(', ') + ' están en tu tienda hoy.';
}

type Notify = NonNullable<Session['notify']>;

/**
 * Discord. The payload carries no puuid, no uid and no credential — only skin
 * names the user themselves chose.
 *
 * A throttled push counted as delivered is the worst bug a notifier can have:
 * it reports success for something nobody received. So a non-2xx throws, with
 * the channel named — a bare "429" sent us measuring the wrong thing once.
 */
export async function deliver(to: Notify, said: string): Promise<string[]> {
  if (!to.discord) throw new Error('no hay ningún canal configurado');
  const res = await fire('https://discord.com/api/webhooks/' + to.discord, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: said }),
  });
  const report = ['discord ' + res.status];
  if (!res.ok) throw new Error(report.join(', '));
  return report;
}

/** True if anything carried it. Never throws: one row's bad luck is not the
 *  run's, and the job counts failures of its own. */
export async function post(
  env: Env,
  uid: string,
  session: Session,
  found: Hit[],
  left: number,
): Promise<boolean> {
  const out: Array<Promise<boolean>> = [];

  if (session.mail?.ok === true) {
    const lang = langOf(session.mail.lang);
    const stop = stopLink(HOME, await mintStop(env, uid));
    out.push(
      send(
        env,
        session.mail.to,
        subject(found, lang),
        html(found, left, lang, HOME, stop),
        text(found, lang, stop),
      )
        .then((r) => r.ok)
        .catch(() => false),
    );
  }

  if (session.notify?.discord) {
    out.push(
      deliver(session.notify, message(found))
        .then(() => true)
        .catch(() => false),
    );
  }

  return (await Promise.all(out)).some(Boolean);
}
