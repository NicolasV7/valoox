import { route } from '../../src/router.ts';
import { setDiscord } from '../../src/routes/discord.ts';
import type { Env, Session } from '../../src/types.ts';
import { fingerprint } from '../../src/vault/keys.ts';
import { createSession } from '../../src/vault/session.ts';
import { session, UID } from './fixtures.ts';
import { freshDb, KEY } from './setup.ts';

export const APP = '123456789012345678';
export const USER = '234567890123456789';
export const ROOM = '345678901234567890';
let privateKey: CryptoKey;
let serial = 0;

export async function setup(): Promise<Env> {
  const keys = (await crypto.subtle.generateKey('Ed25519', true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  privateKey = keys.privateKey;
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
  return {
    ...(await freshDb()),
    JAR_KEY: KEY,
    DISCORD_TOKEN: 'fixture-bot-token',
    DISCORD_APP_ID: APP,
    DISCORD_PUBLIC_KEY: hex(publicKey),
    RESEND_KEY: 'fixture-mail-key',
  };
}

export const watching = (): Session => ({
  ...session(),
  wishlist: [{ id: 'level', name: 'Wanted' }],
  mail: { to: 'person@example.invalid', ok: true, gen: crypto.randomUUID() },
});

export async function linked(env: Env, uid = UID, value = watching()) {
  const s: Session = {
    ...value,
    discord: {
      user: USER,
      room: ROOM,
      name: 'Discord player',
      gen: crypto.randomUUID(),
      lang: 'en',
      ok: true,
    },
  };
  await createSession(env, uid, s);
  await env.DB.prepare("INSERT INTO discord(uid,recipient,gen,state) VALUES (?,?,?,'connected')")
    .bind(uid, await fingerprint(env, 'discord-user', USER), s.discord?.gen)
    .run();
  return s;
}

export const action = (env: Env, action: 'start' | 'remove', uid = UID) =>
  setDiscord({
    env,
    uid,
    headers: new Headers(),
    req: new Request('https://drop.valoox.store/api/discord', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    }),
  });

export function event(name = 'status', code?: string) {
  return {
    id: String(456789012345678900n + BigInt(++serial)),
    application_id: APP,
    type: 2,
    context: 1,
    channel_id: ROOM,
    locale: 'en-US',
    user: { id: USER, username: 'Discord player' },
    data: { name, options: code ? [{ name: 'code', type: 3, value: code }] : [] },
  };
}

export async function signed(body: unknown, at = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(body);
  const stamp = String(at);
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    new TextEncoder().encode(stamp + raw),
  );
  return new Request('https://drop.valoox.store/api/hook/discord', {
    method: 'POST',
    body: raw,
    headers: {
      'content-type': 'application/json',
      'X-Signature-Timestamp': stamp,
      'X-Signature-Ed25519': hex(new Uint8Array(signature)),
    },
  });
}

export const command = async (env: Env, name: string, code?: string) =>
  route(await signed(event(name, code)), env);

const hex = (bytes: Uint8Array) =>
  [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
