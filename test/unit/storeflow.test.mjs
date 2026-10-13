import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';
import { nodes } from '../ui/hooks.mjs';

const view = () => ({
  offers: [],
  remaining: 3600,
  night: null,
  bundles: [],
  accessory: null,
  wallet: { vp: 0, rad: 0, kc: 0 },
  account: { name: 'Player#DEMO', rank: null },
  fetchedAt: Math.floor(Date.now() / 1000),
});
const entry =
  "export {useStore} from './web/data/store.ts'; export * as api from './web/data/api.ts';";
const reply = (value) => ({ ok: true, json: async () => value });

test('automatic refresh preserves the current view and coalesces repeated requests', async () => {
  let finish;
  const actor = { store: view() };
  const f = await fixture(entry, actor);
  const render = () => f.render(() => f.app.useStore());
  render();
  await f.settle();
  const before = render();
  actor.reply = (path) =>
    path === '/api/store'
      ? new Promise((r) => {
          finish = r;
        })
      : undefined;
  const first = before.refresh();
  const second = before.refresh();
  expect(second).toBe(first);
  expect(render().state.at).toBe('in');
  expect(render().state.view).toBe(before.state.view);
  expect(f.context.calls.filter((c) => c.path === '/api/store')).toHaveLength(2);
  finish(reply({ ...view(), remaining: 7200 }));
  await first;
  expect(render().state.view.remaining).toBe(7200);
  f.dispose();
});

test('a failed rotation keeps the old view usable and clears its error after retry', async () => {
  const actor = { store: view() };
  const f = await fixture(entry, actor);
  const render = () => f.render(() => f.app.useStore());
  render();
  await f.settle();
  const before = render();
  actor.reply = () => ({ ok: false, status: 502 });
  await before.refresh();
  expect(render().state).toMatchObject({ at: 'in', view: before.state.view, refreshFailed: true });
  actor.reply = () => reply({ ...view(), remaining: 7200 });
  await render().refresh();
  expect(render().state.refreshFailed).toBe(false);
  expect(render().state.view.remaining).toBe(7200);
  f.dispose();
});

test('an upstream response that is still at zero keeps retry feedback on screen', async () => {
  const actor = { store: view() };
  const f = await fixture(entry, actor);
  const render = () => f.render(() => f.app.useStore());
  render();
  await f.settle();
  actor.store = { ...view(), remaining: 0 };
  await render().refresh();
  expect(render().state).toMatchObject({ at: 'in', refreshFailed: true });
  f.dispose();
});

test('logout during refresh rejects a late store response from the previous account', async () => {
  let finish;
  const actor = { store: view() };
  const f = await fixture(entry, actor);
  const render = () => f.render(() => f.app.useStore());
  render();
  await f.settle();
  actor.reply = (path) =>
    path === '/api/store'
      ? new Promise((r) => {
          finish = r;
        })
      : undefined;
  const request = render().refresh();
  await f.app.api.logout();
  expect(render().state.at).toBe('out');
  finish(reply(view()));
  await request;
  expect(render().state.at).toBe('out');
  f.dispose();
});

test('the actual App keeps its collection and inventory during a rotation', async () => {
  let now = Date.now();
  let finish;
  const actor = {
    store: { ...view(), remaining: 1 },
    inventory: { byType: { owned: ['owned'] }, worn: null, fetchedAt: 1 },
    prefs: { wishlist: [], mail: null, code: null },
  };
  const f = await fixture("export {App} from './web/App.tsx';", actor, {
    Date: { now: () => now },
    setTimeout: () => 0,
  });
  const render = () => f.render(() => f.app.App());
  render();
  await f.settle();
  render();
  await f.settle();
  const before = nodes(render()).find((n) => n.type?.name === 'Screen');
  expect(before.props.inv.byType.owned).toEqual(['owned']);
  actor.reply = (path) =>
    path === '/api/store'
      ? new Promise((r) => {
          finish = r;
        })
      : undefined;
  now += 2000;
  f.context.window.dispatchEvent(new Event('focus'));
  const during = nodes(render()).find((n) => n.type?.name === 'Screen');
  expect(during.props.view).toBe(before.props.view);
  expect(during.props.inv).toBe(before.props.inv);
  finish(reply({ ...view(), remaining: 7200 }));
  await f.settle();
  const after = nodes(render()).find((n) => n.type?.name === 'Screen');
  expect(after.props.view.remaining).toBe(7200);
  expect(after.props.inv).toBe(before.props.inv);
  expect(after.props.route.tab).toBe('weapons');
  expect(f.context.calls.filter((c) => c.path === '/api/store')).toHaveLength(2);
  expect(f.context.calls.filter((c) => c.path === '/api/inventory')).toHaveLength(1);
  f.dispose();
});

test('a countdown does not show zero before expiry or reset its deadline on rerender', async () => {
  let now = 1000400;
  let tick;
  const f = await fixture(
    "export {Countdown} from './web/components/Countdown.tsx';",
    {},
    {
      Date: { now: () => now },
      setInterval: (fn) => {
        tick = fn;
        return 1;
      },
    },
  );
  const render = () => f.render(() => f.app.Countdown({ from: 1 }));
  expect(render().props.children).toBe('00:00:01');
  now += 900;
  tick();
  expect(render().props.children).toBe('00:00:01');
  now += 100;
  tick();
  expect(render().props.children).toBe('00:00:00');
  f.dispose();
});
