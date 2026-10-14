import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';
import { nodes } from '../ui/hooks.mjs';

const reply = (data) => ({ ok: true, json: async () => ({ data }) });
const weapons = ['first', 'second'].map((id) => ({
  uuid: id,
  displayName: id,
  category: 'EEquippableCategory::Rifle',
  skins: [{ uuid: id + '-skin', displayName: id, levels: [{ uuid: id + '-level' }] }],
}));

test('an item change immediately hides the preceding metadata and ignores a late response', async () => {
  const pending = new Map();
  const actor = {
    reply: (path) => new Promise((resolve) => pending.set(path.split('/').pop(), resolve)),
  };
  const f = await fixture("export {useSkin} from './web/data/usePiece.ts';", actor);
  const render = (id) => f.render(() => f.app.useSkin(id));
  try {
    expect(render('first')).toBeNull();
    pending.get('first')(reply({ displayName: 'First' }));
    await f.settle();
    expect(render('first')?.name).toBe('First');
    expect(render('second')).toBeNull();
    expect(render('third')).toBeNull();
    pending.get('second')(reply({ displayName: 'Second' }));
    await f.settle();
    expect(render('third')).toBeNull();
    pending.get('third')(reply({ displayName: 'Third' }));
    await f.settle();
    expect(render('third')?.name).toBe('Third');
  } finally {
    f.dispose();
  }
});

test('returning to a cached weapon immediately renders that weapon without another download', async () => {
  const f = await fixture("export {useWeapon} from './web/data/useIndex.ts';", {
    reply: () => reply(weapons),
  });
  const render = (id) => f.render(() => f.app.useWeapon(id));
  try {
    render('first');
    await f.settle();
    expect(render('first')?.id).toBe('first');
    expect(render('second')).toBeNull();
    await f.settle();
    expect(render('second')?.id).toBe('second');
    expect(render('first')?.id).toBe('first');
    expect(render('second')?.id).toBe('second');
    expect(f.context.calls).toHaveLength(1);
  } finally {
    f.dispose();
  }
});

test('skin family metadata follows the requested level rather than the preceding screen', async () => {
  const f = await fixture("export {useFamily} from './web/data/usePiece.ts';", {
    reply: () => reply(weapons),
  });
  const render = (id) => f.render(() => f.app.useFamily(id));
  try {
    render('first-level');
    await f.settle();
    expect(render('first-level')?.levels[0].id).toBe('first-level');
    expect(render('second-level')).toBeNull();
    await f.settle();
    expect(render('second-level')?.levels[0].id).toBe('second-level');
  } finally {
    f.dispose();
  }
});

test('removing all gun ids clears their names without another catalogue request', async () => {
  const f = await fixture("export {useGuns} from './web/data/useGuns.ts';", {
    reply: () => reply({ displayName: 'First' }),
  });
  const render = (ids) => f.render(() => f.app.useGuns(ids));
  try {
    render(['first']);
    await f.settle();
    await f.settle();
    expect(render(['first']).first).toBe('First');
    expect(Object.keys(render([]))).toEqual([]);
    expect(f.context.calls).toHaveLength(1);
  } finally {
    f.dispose();
  }
});

test('removing the equipped card and rank also removes their old images immediately', async () => {
  const f = await fixture("export {StoreHeader} from './web/screens/Store.header.tsx';", {
    reply: (path) =>
      reply(
        path.endsWith('competitivetiers')
          ? [{ tiers: [{ tier: 12, largeIcon: '/rank.png' }] }]
          : { wideArt: '/card.png' },
      ),
  });
  const render = (account) =>
    f.render(() =>
      f.app.StoreHeader({
        account,
        wallet: { vp: 0, rad: 0, kc: 0 },
        remaining: 60,
      }),
    );
  const images = (tree) => nodes(tree).filter((node) => node.type === 'img');
  try {
    const account = { name: 'Player#DEMO', rank: { tier: 12, rr: 50 }, card: 'card' };
    render(account);
    await f.settle();
    await f.settle();
    expect(images(render(account))).toHaveLength(2);
    expect(images(render({ ...account, rank: null, card: null }))).toHaveLength(0);
    expect(f.context.calls).toHaveLength(2);
  } finally {
    f.dispose();
  }
});
