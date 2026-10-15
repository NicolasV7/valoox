import { expect, test } from 'vitest';
import { build } from '../../src/discord/alert.ts';
import type { Session } from '../../src/types.ts';

const session: Session = {
  jar: { ssid: 'private-credential' },
  puuid: 'private-player-id',
  name: 'Player#TAG',
  discord: {
    user: '234567890123456789',
    room: '345678901234567890',
    name: 'Reader',
    gen: 'generation',
    lang: 'en',
    ok: true,
  },
};

test('Discord messages distinguish unavailable prices, free offers and accessory currency', () => {
  const out = build(
    'owner',
    session,
    [
      { id: 'one', name: 'Unavailable', cost: null },
      { id: 'two', name: 'Free', cost: 0 },
      { id: 'three', name: 'Accessory', type: 'spray', cost: 5500 },
    ],
    3600,
  );
  expect(out.message.content).toContain('Price unavailable');
  expect(out.message.content).toContain('0 VP');
  expect(out.message.content).toContain('5,500 KC');
  expect(out.message.content).not.toContain('private-credential');
  expect(out.message.content).not.toContain('private-player-id');
});

test('large lists remain within Discord limits and escape message formatting', () => {
  const items = Array.from({ length: 150 }, (_, n) => ({
    id: String(n),
    name: '**<@123456789012345678>**\\'.repeat(3),
    cost: 1775,
  }));
  const out = build('owner', session, items, 3600);
  expect(out.message.content.length).toBeLessThanOrEqual(2000);
  expect(out.message.content).toContain('more matches');
  expect(out.message.content).not.toContain('**<@123456789012345678>**');
});

test('a Discord alert expires within its rotation and uses the selected language', () => {
  const before = Date.now();
  if (!session.discord) throw new Error('fixture');
  const out = build(
    'owner',
    { ...session, discord: { ...session.discord, lang: 'es' } },
    [],
    90000,
  );
  expect(out.until).toBeLessThanOrEqual(Date.now() + 23 * 3600000);
  expect(out.until).toBeGreaterThanOrEqual(before);
  expect(out.message.content).toContain('Algo de tu lista');
  expect(build('owner', session, [], -1).until).toBeLessThanOrEqual(Date.now());
});

test('weapon pictures use the same public render as email without exposing credentials', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  const out = build('owner', session, [{ id, name: 'Weapon', cost: 1775 }], 3600);
  expect(out.message.embeds).toEqual([
    { image: { url: 'https://drop.valoox.store/render/' + id + '.png' } },
  ]);
  expect(JSON.stringify(out.message)).not.toContain('private-credential');
  expect(JSON.stringify(out.message)).not.toContain('private-player-id');
});

test('accessories and invalid identifiers never become weapon picture URLs', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  const out = build(
    'owner',
    session,
    [
      { id, name: 'Accessory', type: 'spray', cost: 1000 },
      { id: 'https://example.invalid/picture.png', name: 'Invalid', cost: 1775 },
    ],
    3600,
  );
  expect(out.message.embeds).toEqual([]);
  expect(out.message.content).toContain('Accessory');
});
