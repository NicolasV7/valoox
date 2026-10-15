import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';
import { nodes } from '../ui/hooks.mjs';

const entry = `export {useDiscord} from './web/data/discord.ts';
export {tell,usePrefs} from './web/data/channel.ts';
export {DiscordReady} from './web/screens/Alerts.discordready.tsx';`;
const prefs = () => ({
  wishlist: [],
  mail: null,
  code: null,
  discordApp: '123456789012345678',
  discord: null,
  discordLink: null,
});

test('a connected account cannot request a code through an old event handler', async () => {
  const actor = { prefs: { ...prefs(), discord: { name: 'Reader', ok: true, said: '' } } };
  const f = await fixture(entry, actor);
  f.app.tell(actor.prefs);
  const flow = f.render(() => f.app.useDiscord(f.app.usePrefs()));
  await flow.start();
  expect(f.context.calls.filter((call) => call.path === '/api/discord')).toHaveLength(0);
  f.dispose();
});

test('provider checking locks both mutations even when an old handler is retained', async () => {
  const actor = { prefs: prefs() };
  const f = await fixture(entry, actor);
  f.app.tell(actor.prefs);
  const render = () => f.render(() => f.app.useDiscord(f.app.usePrefs()));
  const old = render();
  actor.prefs = { ...actor.prefs, discordLink: { until: Date.now() + 600000, state: 'checking' } };
  f.app.tell(actor.prefs);
  expect(render().locked).toBe(true);
  await old.start();
  await old.remove();
  expect(f.context.calls.filter((call) => call.path === '/api/discord')).toHaveLength(0);
  f.dispose();
});

test('connected UI removes setup controls and requires a separate disconnect confirmation', async () => {
  const actor = { prefs: { ...prefs(), discord: { name: 'Reader', ok: true, said: '' } } };
  const f = await fixture(entry, actor);
  let removed = 0;
  const render = () =>
    f.render(() =>
      f.app.DiscordReady({
        prefs: actor.prefs,
        flow: { busy: false, locked: false, remove: () => removed++ },
      }),
    );
  const buttons = (tree) => nodes(tree).filter((node) => node.type === 'button');
  const before = buttons(render());
  expect(before).toHaveLength(1);
  before[0].props.onClick();
  expect(removed).toBe(0);
  const confirm = buttons(render()).find(
    (button) => button.props.children === 'Yes, disconnect Discord',
  );
  expect(confirm).toBeDefined();
  confirm.props.onClick();
  expect(removed).toBe(1);
  f.dispose();
});
