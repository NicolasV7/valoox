import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';

test('missing bundle metadata stops loading and retries until real artwork arrives', async () => {
  let now = Date.now();
  let scheduled;
  let available = false;
  const actor = {
    reply: () =>
      available
        ? {
            ok: true,
            json: async () => ({ data: { displayName: 'New bundle', displayIcon: '/art.png' } }),
          }
        : { ok: false, status: 404 },
  };
  const f = await fixture("export {useBundle} from './web/data/useBundle.ts';", actor, {
    Date: { now: () => now },
    setTimeout: (fn, delay) => {
      scheduled = { fn, delay };
      return 1;
    },
    clearTimeout: () => {},
  });
  const render = () => f.render(() => f.app.useBundle('new-bundle'));
  expect(render()).toBeUndefined();
  await f.settle();
  expect(render()).toBeNull();
  expect(scheduled.delay).toBe(30000);
  available = true;
  f.context.document.hidden = true;
  now += 30000;
  await scheduled.fn();
  expect(f.context.calls).toHaveLength(1);
  f.context.document.hidden = false;
  f.context.document.dispatchEvent(new Event('visibilitychange'));
  await f.settle();
  expect(render()?.icon).toBe('/art.png');
  expect(f.context.calls).toHaveLength(2);
  f.dispose();
});
