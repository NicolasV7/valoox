// The one place this service sends mail.
//
// In the vault with the Riot calls, because what makes it belong here is not
// whose API it is: it is that it leaves this origin, so it goes through rf()
// and past assertAllowed() like everything else. api.resend.com is a rule in
// upstream.ts with its own `why:`.
//
// What a send returns is the provider's own status and nothing else. A 2xx
// means Resend accepted the message — not that it reached a mailbox, survived
// a filter, or was read. Those are different claims and this module is careful
// never to make them; what the webhook adds later is also the provider's word,
// reported as theirs.
//
// No retry, unlike the daily alert. This one is a person waiting on a button:
// three tries at six seconds is eighteen seconds of a spinner before they are
// told the address was wrong, and the whole point of the screen is to tell
// them quickly.

import type { Env } from '../types.ts';
import { rf } from './http.ts';

const API = 'https://api.resend.com/emails';
const TIMEOUT = 8000;

/** What the provider said, in the shape the screens report. `said` is for a
 *  person to read and goes on screen exactly as built here. */
export interface Sent {
  ok: boolean;
  status: number;
  /** Resend's id for the message, which its webhook quotes back. */
  id?: string;
  said: string;
}

/**
 * Addresses this will send to.
 *
 * Deliberately not RFC 5322 — that grammar admits quoted strings, comments and
 * bracketed literals, and a parser for it is a liability on an input that one
 * round trip validates for real. This rejects what cannot be an address and
 * lets the code in the message decide the rest.
 */
const ADDRESS = /^[^\s@,;:<>"']{1,64}@[^\s@,;:<>"'.]{1,63}(\.[^\s@,;:<>"'.]{1,63})+$/;

export const looksLikeAddress = (to: string): boolean => to.length <= 254 && ADDRESS.test(to);

/**
 * Whether the last word about an address means it cannot receive.
 *
 * A 4xx is the provider refusing the address before anything left; a bounce or
 * a complaint is the far end refusing it after looking. Both mean the same
 * thing to the sender — this address does not work — and both have to stop a
 * resend, because sending the same message to the same mailbox again is the
 * one action that cannot help.
 *
 * web/data/channel.ts holds the same two lines for the screens. They are two
 * runtimes and the duplicate is deliberate; if one changes, change both.
 */
export const refused = (said: string | undefined): boolean =>
  !!said && (/^resend 4/.test(said) || said === 'email.bounced' || said === 'email.complained');

/**
 * Whether the provider says the message got where it was going.
 *
 * One event, deliberately. `email.delivered` only means the receiving server
 * took it, which a spam folder also does, and blocking on that would strand
 * somebody whose code is sitting in one. Adding it here is a one-word change
 * if that trade ever looks worth making.
 *
 * Read this with a clear head: an open is mostly a machine. Apple Mail
 * Privacy Protection fetches the pixel for every message whether or not a
 * person looks at it, and Gmail prefetches through its proxy. So this is
 * evidence the message reached a mailbox, not that anybody read it — which is
 * why what it gates is bounded by the code's own ten minutes rather than
 * being a door that locks.
 */
const GOT_THERE = ['email.opened'];

export const gotThere = (said: string | undefined): boolean => !!said && GOT_THERE.includes(said);

/**
 * How much a given event is worth, so a slower one cannot overwrite a faster
 * one. Resend does not promise order, and a `delivered` arriving after an
 * `opened` would otherwise walk the state backwards; a bounce outranks
 * everything because it is the only one that changes what the app allows.
 */
const WEIGHT: Record<string, number> = {
  'email.sent': 1,
  'email.delivery_delayed': 2,
  'email.delivered': 3,
  'email.opened': 4,
  'email.clicked': 5,
  'email.failed': 8,
  'email.bounced': 9,
  'email.complained': 9,
};

export const outranks = (next: string, was: string | undefined): boolean =>
  (WEIGHT[next] ?? 0) >= (WEIGHT[was ?? ''] ?? 0);

export async function send(
  env: Env,
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<Sent> {
  if (!env.RESEND_KEY || !env.MAIL_FROM) {
    // Not configured is not the address's fault, and saying "refused" would
    // send somebody to check their spelling for our missing secret.
    return { ok: false, status: 0, said: 'mail no configurado' };
  }

  let res: Response;
  try {
    res = await rf(API, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
  } catch {
    // Aborted, or the connection never opened. Ours, not the address's.
    return { ok: false, status: 0, said: 'resend sin respuesta' };
  }

  const said = 'resend ' + res.status;
  if (!res.ok) return { ok: false, status: res.status, said };

  const body = (await res.json().catch(() => null)) as { id?: string } | null;
  return { ok: true, status: res.status, id: body?.id, said };
}
