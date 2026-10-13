import { afterEach, expect, test, vi } from 'vitest';
import { bundle } from '../../web/data/catalogue.ts';

afterEach(() => vi.unstubAllGlobals());

test('a newly published bundle can recover after a cached 404 or missing artwork', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(Response.json({ data: { displayName: 'New bundle' } }))
    .mockResolvedValueOnce(
      Response.json({ data: { displayName: 'New bundle', displayIcon: '/art.png' } }),
    );
  vi.stubGlobal('fetch', fetcher);
  expect(await bundle('new-bundle')).toBeNull();
  expect((await bundle('new-bundle'))?.icon).toBeNull();
  expect((await bundle('new-bundle'))?.icon).toBe('/art.png');
  expect((await bundle('new-bundle'))?.icon).toBe('/art.png');
  expect(fetcher).toHaveBeenCalledTimes(3);
});
