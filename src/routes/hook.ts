import { verify } from '../alerts/svix.ts';
import { HttpError, readText } from '../lib/body.ts';
import * as messages from '../storage/messages.ts';
import type { Env } from '../types.ts';
import { outranks, refused } from '../vault/mail.ts';
import { readSession, saveSession } from '../vault/session.ts';

interface Event {
  type?: string;
  data?: { email_id?: string; tags?: Record<string, string> };
}
export async function resendHook(req: Request, env: Env): Promise<Response> {
  const raw = await readText(req);
  if (
    !(await verify({
      secret: env.RESEND_HOOK,
      id: req.headers.get('svix-id'),
      stamp: req.headers.get('svix-timestamp'),
      sigs: req.headers.get('svix-signature'),
      body: raw,
    }))
  )
    return new Response(null, { status: 401 });
  let event: Event;
  try {
    event = JSON.parse(raw) as Event;
  } catch {
    throw new HttpError(400, 'invalid event');
  }
  const id = event.data?.email_id;
  const kind = event.type;
  if (typeof id !== 'string' || typeof kind !== 'string')
    return new Response(null, { status: 204 });
  const tag = event.data?.tags?.valoox_message;
  const message = await messages.find(env, id, typeof tag === 'string' ? tag : undefined);
  if (!message || (message.provider && message.provider !== id))
    return new Response(null, { status: 204 });
  await messages.bind(env, message.id, id);
  for (let retry = 0; retry < 3; retry++) {
    const held = await readSession(env, message.uid);
    const mail = held?.session.mail;
    if (!held || !mail || mail.gen !== message.gen) return new Response(null, { status: 204 });
    if (!outranks(kind, mail.said)) return new Response(null, { status: 204 });
    held.session.mail = { ...mail, said: kind, ok: refused(kind) ? false : mail.ok };
    if (await saveSession(env, message.uid, held.session, held.ver)) {
      return new Response(null, { status: 204 });
    }
  }
  // A provider retry is useful when concurrent session writes won every CAS.
  return new Response(null, { status: 503 });
}
