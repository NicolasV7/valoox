import { afterEach, expect, test, vi } from 'vitest';
import type { Ctx } from '../../src/lib/json.ts';
import { store } from '../../src/routes/store.ts';
import { storeView } from '../workers/fixtures.ts';

const mocks = vi.hoisted(() => ({
  read: vi.fn(async () => null),
  write: vi.fn(async () => true),
  live: vi.fn(async () => ({ session: {}, t: {} })),
  fetch: vi.fn(),
}));
vi.mock('../../src/vault/session.ts', () => ({ readCache: mocks.read, writeCache: mocks.write }));
vi.mock('../../src/vault/live.ts', () => ({ live: mocks.live }));
vi.mock('../../src/vault/storefront.ts', () => ({ fetchStore: mocks.fetch }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test('the store route caches only until the earliest section deadline', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(1000000);
  const view = {
    ...storeView(),
    fetchedAt: 995,
    bundles: [{ id: 'bundle', remaining: 30, items: [], base: null, price: null }],
    night: { remaining: 300, items: [] },
    accessory: { remaining: 600, items: [] },
  };
  mocks.fetch.mockResolvedValue(view);
  const env = {};
  expect(await store({ env, uid: 'fixture' } as Ctx)).toBe(view);
  // Five seconds spent fetching ownership must not extend the bundle by five seconds.
  expect(mocks.write).toHaveBeenCalledWith(env, 'store', 'fixture', view, 25);
});
