import type { Env } from '../types.ts';

export const snowflake = (value: unknown): value is string =>
  typeof value === 'string' && /^[1-9]\d{16,19}$/.test(value);

export const avatarHash = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:a_)?[a-f0-9]{32}$/.test(value);

export const configured = (env: Env): boolean =>
  snowflake(env.DISCORD_APP_ID) &&
  /^[0-9a-f]{64}$/i.test(env.DISCORD_PUBLIC_KEY ?? '') &&
  !!env.DISCORD_TOKEN?.trim();
