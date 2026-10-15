import { expect, test } from 'vitest';
import { assertAllowed } from '../../src/vault/upstream.ts';

test('Discord profile reads and image URLs pin the host, identity, size and method', () => {
  const user = 'https://discord.com/api/v10/users/123456789012345678';
  const image =
    'https://cdn.discordapp.com/avatars/123456789012345678/' + 'a'.repeat(32) + '.png?size=128';
  for (const url of [user, image, 'https://cdn.discordapp.com/embed/avatars/5.png']) {
    expect(() => assertAllowed('GET', url)).not.toThrow();
    expect(() => assertAllowed('POST', url)).toThrow();
    expect(() => assertAllowed('GET', url.replace('.com', '.com.evil.invalid'))).toThrow();
  }
  for (const url of [
    user + '/extra',
    user + '?x=1',
    user.replace('123456789012345678', '@me'),
    image.replace('size=128', 'size=4096'),
    image + '&extra=1',
    image.replace('.png', '.svg'),
    'https://cdn.discordapp.com/embed/avatars/6.png',
  ]) {
    expect(() => assertAllowed('GET', url)).toThrow();
  }
});
