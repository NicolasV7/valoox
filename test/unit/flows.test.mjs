import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';
import { nodes } from '../ui/hooks.mjs';

const response = (value) => ({ ok: true, json: async () => value });
const prefs = () => ({
  wishlist: [{ id: 'saved', name: 'Saved' }],
  mail: { to: 'person@example.invalid', ok: false, said: 'email.sent' },
  code: { until: Date.now() + 600000, tries: 5 },
});
const entry = (name, file) =>
  `export {${name}} from './web/screens/${file}'; export {tell,waiting} from './web/data/channel.ts';`;
const button = (tree, text) =>
  nodes(tree).find((n) => n.type === 'button' && n.props.children === text);

test('failed email requests release the button and repeated taps send only one request', async () => {
  let finish;
  const actor = {
    prefs: { ...prefs(), mail: null, code: null },
    reply: (path) =>
      path === '/api/channel'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : undefined,
  };
  const f = await fixture(entry('AlertsChannel', 'Alerts.channel.tsx'), actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.AlertsChannel());
  let tree = render();
  nodes(tree)
    .find((n) => n.type === 'input')
    .props.onInput({ currentTarget: { value: 'person@example.invalid' } });
  tree = render();
  const send = button(tree, 'Send the code');
  const first = send.props.onClick();
  await send.props.onClick();
  expect(f.context.calls.filter((x) => x.path === '/api/channel')).toHaveLength(1);
  finish({ ok: false, status: 503 });
  await first;
  tree = render();
  expect(button(tree, 'Send the code').props.disabled).toBe(false);
  expect(nodes(tree).find((n) => n.props?.role === 'alert')).toBeDefined();
});

test('a late verification response cannot navigate a screen that has been unmounted', async () => {
  let finish;
  const actor = {
    prefs: prefs(),
    reply: (path) =>
      path === '/api/channel/verify'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : undefined,
  };
  const f = await fixture(entry('AlertsCode', 'Alerts.code.tsx'), actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.AlertsCode());
  let tree = render();
  nodes(tree)
    .find((n) => n.type === 'input')
    .props.onInput({ currentTarget: { value: '123456' } });
  tree = render();
  const request = button(tree, 'Verify this address').props.onClick();
  f.dispose();
  finish(response({ ok: true }));
  await request;
  expect(f.context.routes).toHaveLength(0);
});

test('spent code attempts disable verification after the saved state refreshes', async () => {
  const actor = {
    prefs: prefs(),
    reply: (path) => {
      if (path !== '/api/channel/verify') return;
      actor.prefs = { ...actor.prefs, code: null };
      return response({ error: 'spent', left: null });
    },
  };
  const f = await fixture(entry('AlertsCode', 'Alerts.code.tsx'), actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.AlertsCode());
  let tree = render();
  nodes(tree)
    .find((n) => n.type === 'input')
    .props.onInput({ currentTarget: { value: '123456' } });
  await button(render(), 'Verify this address').props.onClick();
  tree = render();
  expect(button(tree, 'Verify this address').props.disabled).toBe(true);
  expect(button(tree, 'Send it again')).toBeDefined();
  expect(nodes(tree).find((n) => n.props?.role === 'alert').props.children).toContain(
    'No attempts left',
  );
});

test('email removal retains favourites and a leftover proof cannot offer verification', async () => {
  const actor = {
    prefs: prefs(),
    reply: (path) => {
      if (path !== '/api/stop') return;
      actor.prefs = { ...actor.prefs, mail: null };
      return response({ ok: true });
    },
  };
  const f = await fixture(entry('AlertsRemove', 'Alerts.remove.tsx'), actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.AlertsRemove());
  await button(render(), 'Remove email address').props.onClick();
  const tree = render();
  expect(actor.prefs.wishlist).toHaveLength(1);
  expect(nodes(tree).some((n) => n.props?.href === '/alerts')).toBe(true);
  expect(f.app.waiting(actor.prefs)).toBe(false);
});

test('failed email removal keeps the address and does not render a success screen', async () => {
  const actor = {
    prefs: prefs(),
    reply: (path) =>
      path === '/api/stop' ? response({ ok: false, error: 'conflict' }) : undefined,
  };
  const f = await fixture(entry('AlertsRemove', 'Alerts.remove.tsx'), actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.AlertsRemove());
  await button(render(), 'Remove email address').props.onClick();
  const tree = render();
  expect(actor.prefs.mail).not.toBeNull();
  expect(button(tree, 'Remove email address')).toBeDefined();
  expect(nodes(tree).find((n) => n.props?.role === 'alert')).toBeDefined();
});
