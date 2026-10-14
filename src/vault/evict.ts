// Cache namespaces and eviction do not depend on session reads. Both the
// authenticated cache and session revocation can use them without a cycle.
import type { Env } from '../types.ts';
import { fingerprint } from './keys.ts';

export type Cache = 'store' | 'inv';
const VERSION: Record<Cache, number> = { store: 4, inv: 3 };
export const cacheKey = async (env: Env, name: Cache, uid: string) =>
  name + VERSION[name] + ':' + (await fingerprint(env, 'cache', uid));

export async function clearCache(env: Env, uid: string): Promise<void> {
  await Promise.all(
    (['store', 'inv'] as const).map(async (name) => env.VAL.delete(await cacheKey(env, name, uid))),
  );
}
