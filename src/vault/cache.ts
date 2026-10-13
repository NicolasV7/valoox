import { expiresAt } from '../lib/expiry.ts';
import type { Env, StoreView } from '../types.ts';
import { fingerprint } from './keys.ts';
import { CURRENT_KID, open, seal } from './seal.ts';
import { readSession } from './session.ts';
import { inventoryShape, storeShape } from './shape.ts';

export type Cache = 'store' | 'inv';
const VERSION: Record<Cache, number> = { store: 4, inv: 3 };
const purpose = (name: Cache) => (name === 'store' ? ('store:4' as const) : ('inv:3' as const));
const valid = (name: Cache, v: unknown) => (name === 'store' ? storeShape : inventoryShape)(v);
const key = async (env: Env, name: Cache, uid: string) =>
  name + VERSION[name] + ':' + (await fingerprint(env, 'cache', uid));

/** D1 is authoritative for revocation. KV deletion may take time to propagate. */
export async function readCache(env: Env, name: Cache, uid: string): Promise<unknown | null> {
  if (!(await readSession(env, uid))) return null;
  const raw = await env.VAL.get(await key(env, name, uid));
  if (!raw) return null;
  try {
    const view = await open<unknown>(env, uid, CURRENT_KID, raw, purpose(name));
    if (!valid(name, view)) return null;
    // KV has a 60-second minimum TTL and may serve an older entry in another
    // location. The payload's deadline, rather than KV eviction, decides freshness.
    if (name === 'store' && expiresAt(view as StoreView) <= Date.now()) return null;
    return (await readSession(env, uid)) ? view : null;
  } catch {
    return null;
  }
}

export async function writeCache(
  env: Env,
  name: Cache,
  uid: string,
  view: unknown,
  ttl: number,
): Promise<boolean> {
  if (!valid(name, view)) throw new Error('invalid cache shape');
  if (!(await readSession(env, uid))) return false;
  if (name === 'store' && expiresAt(view as StoreView) <= Date.now()) {
    return !!(await readSession(env, uid));
  }
  await env.VAL.put(
    await key(env, name, uid),
    await seal(env, uid, CURRENT_KID, view, purpose(name)),
    {
      expirationTtl: Math.max(60, ttl),
    },
  );
  return !!(await readSession(env, uid));
}

export async function clearCache(env: Env, uid: string): Promise<void> {
  await Promise.all(
    ['store', 'inv'].map(async (n) => env.VAL.delete(await key(env, n as Cache, uid))),
  );
}
