import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';
import { storeView } from '../workers/fixtures.ts';

test('the real store hook stops failed automatic requests and restarts after manual recovery', async () => {
  let now = Date.now();
  let remaining = 0;
  let serial = 0;
  const tasks = new Map();
  const f = await fixture(
    "export {useStore} from './web/data/store.ts';",
    {
      reply: () => ({
        ok: true,
        json: async () => ({ ...storeView(), remaining, fetchedAt: Math.floor(now / 1000) }),
      }),
    },
    {
      Date: { now: () => now },
      setTimeout: (fn, delay) => {
        tasks.set(++serial, { fn, delay });
        return serial;
      },
      clearTimeout: (id) => tasks.delete(id),
    },
  );
  const render = () => f.render(() => f.app.useStore());
  const tick = async () => {
    const [id, task] = tasks.entries().next().value;
    tasks.delete(id);
    now += task.delay;
    await task.fn();
    await f.settle();
  };
  try {
    render();
    await f.settle();
    render();
    for (let i = 0; tasks.size && i < 20; i++) await tick();
    expect(f.context.calls).toHaveLength(9); // Initial load plus eight automatic attempts.
    expect(tasks.size).toBe(0);
    expect(render().state.refreshFailed).toBe(true);
    f.context.window.dispatchEvent(new Event('focus'));
    await f.settle();
    expect(f.context.calls).toHaveLength(9);
    remaining = 2;
    await render().refresh();
    expect(render().state.refreshFailed).toBe(false);
    expect(tasks.size).toBe(1);
    await tick();
    expect(f.context.calls).toHaveLength(11); // Manual recovery plus the next actual rotation.
  } finally {
    f.dispose();
  }
});
