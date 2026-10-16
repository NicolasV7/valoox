import { HttpError, readJson } from '../lib/body.ts';
import type { Body, Ctx } from '../lib/json.ts';
import { RESEED } from '../lib/json.ts';
import { readSession } from '../vault/session.ts';
import { load, save } from '../vault/sharing.ts';

export async function readSharing({ env, uid }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  return (await load(env, uid, held.session.puuid)) ?? RESEED;
}

export async function writeSharing({ env, uid, req }: Ctx): Promise<Body> {
  const held = await readSession(env, uid);
  if (!held) return RESEED;
  const body = await readJson(req, 128);
  if (typeof body.tag !== 'boolean' || Object.keys(body).some((key) => key !== 'tag'))
    throw new HttpError(400, 'tag required');
  return (await save(env, uid, held.session.puuid, body.tag)) ? { tag: body.tag } : RESEED;
}
