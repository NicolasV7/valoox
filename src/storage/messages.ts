import type { Env } from '../types.ts';
import { now } from './rows.ts';

export interface Message {
  id: string;
  uid: string;
  gen: string;
  provider: string | null;
}
export async function find(env: Env, provider: string, tag?: string): Promise<Message | null> {
  // The opaque tag is reserved before sending, including early signed events.
  return env.DB.prepare(
    'SELECT id,uid,gen,provider FROM messages WHERE expires>? AND (provider=? OR id=?)',
  )
    .bind(now(), provider, tag ?? '')
    .first<Message>();
}
export async function bind(env: Env, id: string, provider: string): Promise<void> {
  await env.DB.prepare(
    'UPDATE messages SET provider=? WHERE id=? AND (provider IS NULL OR provider=?)',
  )
    .bind(provider, id, provider)
    .run();
}
export async function reserve(env: Env, id: string, uid: string, gen: string): Promise<void> {
  await env.DB.prepare('INSERT OR IGNORE INTO messages(id,uid,gen,expires) VALUES (?,?,?,?)')
    .bind(id, uid, gen, now() + 604800)
    .run();
}
