import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';
import { nodes } from '../ui/hooks.mjs';

const entry = `export {AlertsDiscord} from './web/screens/Alerts.discord.tsx';
export {useDiscord} from './web/data/discord.ts';
export {tell,usePrefs} from './web/data/channel.ts';
export {reset} from './web/data/private.ts';`;
const prefs = () => ({
  emailAvailable: true,
  wishlist: [{ id: 'saved', name: 'Saved' }],
  mail: { to: 'reader@example.invalid', ok: true, said: 'email.sent' },
  code: null,
  discord: null,
  discordLink: null,
  discordApp: '123456789012345678',
});
const response = (value) => ({ ok: true, json: async () => value });
const button = (tree, text) =>
  nodes(tree).find((node) => node.type === 'button' && node.props.children === text);

test('an unconfigured bot has a readable unavailable state without offering a broken connection', async () => {
  const actor = { prefs: { ...prefs(), discordApp: null } };
  const f = await fixture(entry, actor);
  f.app.tell(actor.prefs);
  const tree = f.render(() => f.app.AlertsDiscord());
  expect(button(tree, 'Get a connection code')).toBeUndefined();
  expect(
    nodes(tree).some((node) =>
      String(node.props.children).includes('Email alerts are still available'),
    ),
  ).toBe(true);
});

test('failed connection requests release the button and repeated taps make one request', async () => {
  let finish;
  const actor = {
    prefs: prefs(),
    reply: (path) =>
      path === '/api/discord'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : undefined,
  };
  const f = await fixture(entry, actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.useDiscord(f.app.usePrefs()));
  const first = render().start();
  await render().start();
  expect(f.context.calls.filter((call) => call.path === '/api/discord')).toHaveLength(1);
  finish({ ok: false, status: 503 });
  await first;
  expect(render().busy).toBe(false);
  expect(render().problem).toBe('network');
  f.dispose();
});

test('failed Discord removal keeps its connection and the verified email', async () => {
  const actor = {
    prefs: { ...prefs(), discord: { name: 'Discord player', ok: true, said: '' } },
    reply: (path) => (path === '/api/discord' ? response({ error: 'conflict' }) : undefined),
  };
  const f = await fixture(entry, actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.useDiscord(f.app.usePrefs()));
  await render().remove();
  expect(actor.prefs.discord.ok).toBe(true);
  expect(actor.prefs.mail.ok).toBe(true);
  expect(render().problem).toBe('network');
  f.dispose();
});

test('codes are cleared when another tab replaces the pending connection', async () => {
  const until = Date.now() + 600000;
  const actor = {
    prefs: prefs(),
    reply: (path) => {
      if (path !== '/api/discord') return;
      actor.prefs.discordLink = { until, state: 'waiting' };
      return response({ code: 'a'.repeat(32), until });
    },
  };
  const f = await fixture(entry, actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.useDiscord(f.app.usePrefs()));
  await render().start();
  expect(render().code.value).toBe('a'.repeat(32));
  actor.prefs = { ...actor.prefs, discordLink: { until: until + 60000, state: 'waiting' } };
  f.app.tell(actor.prefs);
  render();
  expect(render().code).toBeNull();
  f.dispose();
});

test('a late code response cannot leak into the next authenticated account', async () => {
  let finish;
  const actor = {
    prefs: prefs(),
    reply: (path) =>
      path === '/api/discord'
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : undefined,
  };
  const f = await fixture(entry, actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.useDiscord(f.app.usePrefs()));
  const request = render().start();
  f.app.reset('out');
  finish(response({ code: 'a'.repeat(32), until: Date.now() + 600000 }));
  await request;
  expect(render().code).toBeNull();
  f.dispose();
});
