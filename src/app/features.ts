import { HttpError } from '../lib/body.ts';
import type { Env, Session } from '../types.ts';

/** Missing or unexpected configuration keeps email dormant. */
export const emailEnabled = (env: Pick<Env, 'EMAIL_ALERTS'>): boolean =>
  env.EMAIL_ALERTS === 'true';

export const receiving = (env: Env, session: Session): boolean =>
  session.discord?.ok === true || (emailEnabled(env) && session.mail?.ok === true);

export function requireEmail(env: Env): void {
  if (!emailEnabled(env)) throw new HttpError(404, 'not found');
}
