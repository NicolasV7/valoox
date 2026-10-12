import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';
import { nodes } from '../ui/hooks.mjs';

const view = (name) => ({
  offers: [],
  remaining: 3600,
  night: null,
  bundles: [],
  accessory: null,
  wallet: { vp: 0, rad: 0, kc: 0 },
  account: { name, rank: null },
  fetchedAt: 1,
});
test('the actual App clears inventory before loading a different approved account', async () => {
  const actor = {
    store: view('A'),
    inventory: { byType: { owned: ['only-A'] }, worn: null, fetchedAt: 1 },
    prefs: { wishlist: [], discord: '', mail: null, code: null },
  };
  const f = await fixture(
    "export {App} from './web/App.tsx'; export * as api from './web/data/api.ts';",
    actor,
  );
  f.render(() => f.app.App());
  await f.settle();
  f.render(() => f.app.App());
  await f.settle();
  let tree = f.render(() => f.app.App());
  expect(nodes(tree).find((n) => n.type?.name === 'Screen')?.props.inv.byType.owned).toEqual([
    'only-A',
  ]);
  await f.app.api.logout();
  tree = f.render(() => f.app.App());
  expect(nodes(tree).find((n) => n.type?.name === 'Screen')).toBeUndefined();
  actor.store = view('B');
  actor.inventory = { byType: { owned: ['only-B'] }, worn: null, fetchedAt: 1 };
  await f.context.approve();
  tree = f.render(() => f.app.App());
  await f.settle();
  tree = f.render(() => f.app.App());
  const screen = nodes(tree).find((n) => n.type?.name === 'Screen');
  expect(screen?.props.view.account.name).toBe('B');
  expect(screen?.props.inv.byType.owned).toEqual(['only-B']);
});
test('the actual disconnect handler stays on screen when deletion failed', async () => {
  const actor = { fail: true };
  const f = await fixture("export {AccountLeave} from './web/screens/Account.leave.tsx';", actor);
  let gone = 0;
  const render = () => f.render(() => f.app.AccountLeave({ onGone: () => gone++ }));
  let tree = render();
  const button = nodes(tree).find(
    (n) => n.type === 'button' && n.props.class.includes('btn--gone'),
  );
  await button.props.onClick();
  tree = render();
  expect(gone).toBe(0);
  expect(nodes(tree).find((n) => n.props?.role === 'alert')).toBeDefined();
  actor.fail = false;
  await nodes(tree)
    .find((n) => n.type === 'button' && n.props.class.includes('btn--gone'))
    .props.onClick();
  expect(gone).toBe(1);
});
