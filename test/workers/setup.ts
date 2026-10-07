import { env } from 'cloudflare:test';
import { inject } from 'vitest';
import type { Env } from '../../src/types.ts';

declare module 'cloudflare:test' {
  interface ProvidedEnv extends Env {}
}

// `inject` reads from vitest's own context, not the pool's.
declare module 'vitest' {
  interface ProvidedContext {
    schema: string;
  }
}

/**
 * A fresh table per test, built from the real schema.sql rather than an inlined
 * copy — an inlined copy is exactly how production and tests drift apart without
 * anyone noticing, which is the class of bug these tests exist to catch.
 */
export async function freshDb(): Promise<Env> {
  // D1's exec() wants one statement per line, so newlines get collapsed — which
  // means `--` comments must be stripped first, or the comment swallows the rest
  // of the statement and SQLite reports "did not contain a statement".
  const sql = inject('schema')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');

  await env.DB.exec('DROP TABLE IF EXISTS s');
  for (const statement of sql.split(';')) {
    const one = statement.replace(/\s+/g, ' ').trim();
    if (one) await env.DB.exec(one);
  }
  return env as unknown as Env;
}

/** A throwaway sealing key. Never the production one. */
export const KEY = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
