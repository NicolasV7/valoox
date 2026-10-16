import assert from 'node:assert/strict';
import { test } from 'vitest';
import { pick, woff2 } from '../../scripts/fontsource.mjs';

const block = (subset, url, format = 'woff2') =>
  `/* ${subset} */\n@font-face { src: url(${url}) format('${format}'); }`;

test('font downloads select the Latin WOFF2 by format, including quoted query endpoints', () => {
  for (const url of [
    'https://fonts.gstatic.com/s/face/v1/font.woff2',
    'https://fonts.gstatic.com/s/face/v1/font.woff2?version=1',
    '"https://fonts.gstatic.com/l/font?kit=abc&skey=def&v=v1"',
    "'https://fonts.gstatic.com/l/font?kit=abc&skey=def&v=v1'",
  ]) {
    const sheet = block('latin-ext', 'https://fonts.gstatic.com/other.woff2') + block('latin', url);
    assert.equal(pick(sheet, 'latin'), url.replace(/^['"]|['"]$/g, ''));
  }
});

test('a missing subset, legacy format or foreign font host cannot become a downloaded face', () => {
  assert.throws(() => pick(block('latin-ext', 'https://fonts.gstatic.com/a.woff2'), 'latin'));
  assert.throws(() => pick(block('latin', 'https://fonts.gstatic.com/a.ttf', 'truetype'), 'latin'));
  assert.throws(() => pick(block('latin', 'https://other.test/a.woff2'), 'latin'));
  assert.throws(() => pick(block('latin', 'https://user:pass@fonts.gstatic.com/a.woff2'), 'latin'));
});

test('font downloads reject HTML, legacy font signatures and truncated WOFF2 files', () => {
  const bytes = Buffer.alloc(48);
  bytes.write('wOF2');
  assert.equal(woff2(bytes), bytes);
  assert.throws(() => woff2(Buffer.from('wOF2')));
  for (const signature of ['wOFF', 'OTTO', '<!DO']) {
    bytes.write(signature);
    assert.throws(() => woff2(bytes));
  }
});
