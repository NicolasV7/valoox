import { afterEach, expect, test, vi } from 'vitest';
import { render } from '../../src/routes/render.ts';

afterEach(() => vi.unstubAllGlobals());
const id = '00000000-0000-4000-8000-000000000001';
const url = 'https://drop.valoox.store/render/' + id + '.png';

test('image probes return the same headers without transferring a body', async () => {
  const cancel = vi.fn();
  const fetcher = vi.fn(
    async () =>
      new Response(new ReadableStream({ start: (s) => s.enqueue(new Uint8Array([1, 2])), cancel })),
  );
  vi.stubGlobal('fetch', fetcher);
  const head = await render(new Request(url, { method: 'HEAD' }));
  expect(head.status).toBe(200);
  expect(await head.text()).toBe('');
  expect(head.headers.get('content-type')).toBe('image/png');
  expect(head.headers.get('cache-control')).toContain('immutable');
  expect(head.headers.get('x-content-type-options')).toBe('nosniff');
  expect(cancel).toHaveBeenCalledOnce();
  expect(fetcher).toHaveBeenCalledWith(
    'https://media.valorant-api.com/weaponskinlevels/' + id + '/displayicon.png',
    expect.objectContaining({ redirect: 'manual' }),
  );
});

test('invalid image identifiers never make an outbound request', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const response = await render(new Request(url.replace(id, 'not-a-skin'), { method: 'HEAD' }));
  expect(response.status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
});
