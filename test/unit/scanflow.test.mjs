import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';

const entry = "export {useScan} from './web/sign-in.ts';";
const reply = (value) => ({ ok: true, json: async () => value });
const modules = {
  'web/sign-in.ts': null,
  'web/screens/Scan.tsx': 'export const POLL_EVERY=2000; export function Scan(){return null;}',
};

test('a QR poll stops at ten minutes even if every provider read fails', async () => {
  let now = 1000;
  let tick;
  let cleared = 0;
  const f = await fixture(
    entry,
    {
      reply: (_path, init) =>
        init?.method === 'POST'
          ? reply({ url: 'https://example.invalid/qr' })
          : { ok: false, status: 503 },
    },
    {
      Date: { now: () => now },
      setInterval: (fn) => {
        tick = fn;
        return 1;
      },
      clearInterval: () => {
        cleared++;
      },
    },
    modules,
  );
  const render = () => f.render(() => f.app.useScan(async () => {}));
  try {
    await render().start();
    expect(render().state.phase).toBe('ready');
    await tick();
    const before = f.context.calls.length;
    now += 600000;
    await tick();
    expect(render().state.phase).toBe('expired');
    expect(f.context.calls).toHaveLength(before);
    expect(cleared).toBeGreaterThan(1);
  } finally {
    f.dispose();
  }
});

test('unmounting while a QR opens cannot start a late polling interval', async () => {
  let finish;
  let intervals = 0;
  const f = await fixture(
    entry,
    {
      reply: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    },
    {
      setInterval: () => {
        intervals++;
        return 1;
      },
    },
    modules,
  );
  const state = f.render(() => f.app.useScan(async () => {}));
  const opening = state.start();
  f.dispose();
  finish(reply({ url: 'https://example.invalid/qr' }));
  await opening;
  expect(intervals).toBe(0);
});

test('unmounting during approval cannot start the approved-screen timer later', async () => {
  let tick;
  let finish;
  let entered;
  let timers = 0;
  const loading = new Promise((resolve) => {
    finish = resolve;
  });
  const approved = new Promise((resolve) => {
    entered = resolve;
  });
  const f = await fixture(
    entry,
    {
      reply: (_path, init) =>
        reply(
          init?.method === 'POST'
            ? { url: 'https://example.invalid/qr' }
            : { status: 'ok', shard: 'na' },
        ),
    },
    {
      setInterval: (fn) => {
        tick = fn;
        return 1;
      },
      setTimeout: () => {
        timers++;
        return 1;
      },
    },
    modules,
  );
  const state = f.render(() =>
    f.app.useScan(() => {
      entered();
      return loading;
    }),
  );
  await state.start();
  const approval = tick();
  await approved;
  f.dispose();
  finish();
  await approval;
  expect(timers).toBe(0);
});
