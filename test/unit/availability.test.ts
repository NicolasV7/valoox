import { expect, test } from 'vitest';
import { bits, guns } from '../../web/data/findable.ts';
import { keepHidden, visible } from '../../web/data/sellable.ts';
import type { Rack, Skin } from '../../web/data/skins.ts';

test('unowned rewards disappear while an owned parent or level stays visible', () => {
  const rewards = new Set(['reward-level']);
  expect(visible(rewards, new Set(), 'reward', 'reward-level')).toBe(false);
  expect(visible(rewards, new Set(['reward-level']), 'reward', 'reward-level')).toBe(true);
  expect(visible(rewards, new Set(['reward']), 'reward', 'reward-level')).toBe(true);
  expect(visible(rewards, new Set(), 'shop-item')).toBe(true);
});

test('ownership flags still hide unowned rewards when contracts failed to load', () => {
  keepHidden('rank-reward');
  expect(visible(null, new Set(), 'rank-reward')).toBe(false);
  expect(visible(new Set(), new Set(['rank-reward']), 'rank-reward')).toBe(true);
  expect(visible(null, new Set(), 'unknown-item')).toBe(true);
});

test('weapon search checks every level and owned colourway, with melee still eligible', () => {
  const skin = (id: string): Skin => ({
    id,
    name: id,
    tier: 'premium',
    render: null,
    levels: [id + '-base', id + '-upgrade'].map((id) => ({
      id,
      adds: null,
      video: null,
      icon: null,
    })),
    chromas: [{ id: id + '-colour', colour: null, swatch: null, render: null, video: null }],
  });
  const racks: Rack[] = [
    {
      of: 'melee',
      weapons: [
        {
          id: 'knife',
          name: 'Melee',
          icon: null,
          cost: null,
          skins: [skin('reward'), skin('owned'), skin('shop')],
        },
      ],
    },
  ];
  expect(
    guns(racks, new Set(['owned-colour']), new Set(['reward-upgrade'])).map((x) => x.id),
  ).toEqual(['shop-base']);
});

test('accessory search checks buddy aliases, contracts and flags before counting results', () => {
  keepHidden('event-title');
  const found = bits(
    [
      { id: 'pass-spray', name: 'Pass Spray', art: null, gif: null },
      { id: 'shop-spray', name: 'Shop Spray', art: null, gif: null },
    ],
    [
      { id: 'reward-buddy', name: 'Reward Buddy', art: null, levels: ['base', 'award'] },
      { id: 'owned-buddy', name: 'Owned Buddy', art: null, levels: ['first', 'owned-level'] },
    ],
    [],
    [{ id: 'event-title', name: 'Event' }],
    new Set(['owned-level']),
    { spray: 'Spray', buddy: 'Buddy', card: 'Card', title: 'Title' },
    new Set(['pass-spray', 'award']),
  );
  expect(found.map((x) => x.id)).toEqual(['shop-spray']);
});
