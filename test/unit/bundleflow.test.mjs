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

test('missing artwork stops after six attempts and a new bundle gets its own budget', async () => {
  let now = Date.now();
  let serial = 0;
  const tasks = new Map();
  const f = await fixture(
    "export {useBundle} from './web/data/useBundle.ts';",
    {
      reply: () => ({ ok: false, status: 404 }),
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
  const render = (id) => f.render(() => f.app.useBundle(id));
  try {
    render('missing');
    await f.settle();
    for (let i = 0; tasks.size && i < 10; i++) {
      const [id, task] = tasks.entries().next().value;
      tasks.delete(id);
      now += task.delay;
      await task.fn();
      await f.settle();
    }
    expect(f.context.calls).toHaveLength(6);
    expect(tasks.size).toBe(0);
    f.context.document.dispatchEvent(new Event('visibilitychange'));
    f.context.window.dispatchEvent(new Event('online'));
    await f.settle();
    expect(f.context.calls).toHaveLength(6);
    render('different');
    await f.settle();
    expect(f.context.calls).toHaveLength(7);
  } finally {
    f.dispose();
  }
});
