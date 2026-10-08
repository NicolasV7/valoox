// The mark, as a file.
//
// Two circles: one filled, one open, the same pair the app draws inline. A
// mail client cannot have the inline one — Gmail strips <svg> outright and
// Outlook renders through Word, which never supported it — so the message
// needs a PNG, and a PNG is also the favicon every browser agrees on.
//
// Drawn here rather than exported from a design tool, because the geometry is
// already written down in web/components/Mark.tsx and two copies of it would
// drift. Four-times supersampled and box filtered down, which is all the
// anti-aliasing two circles need.
//
//   node scripts/mark.mjs
//
// The output is committed: it is ours, unlike everything under public/art/.

import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

/** The viewBox the app's own mark is drawn in, and the three numbers in it. */
const BOX = 24;
const SOLID = { x: 6.4, y: 12, r: 4.65 };
const OPEN = { x: 17.6, y: 12, r: 4.05, width: 1.9 };

/** 66 is 22 at 3x: the size the message asks for, on the densest screen that
 *  will read it. The favicon is served the same file. */
const SIZE = 66;
const OVER = 4;

const WHITE = [242, 244, 245];

function paint(size) {
  const n = size * OVER;
  const k = n / BOX;
  const px = new Uint8Array(n * n);

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // Sample at the centre of the texel, in viewBox units.
      const u = (x + 0.5) / k;
      const v = (y + 0.5) / k;
      const a = Math.hypot(u - SOLID.x, v - SOLID.y);
      const b = Math.hypot(u - OPEN.x, v - OPEN.y);
      const inside = a <= SOLID.r;
      const ring = Math.abs(b - OPEN.r) <= OPEN.width / 2;
      px[y * n + x] = inside || ring ? 255 : 0;
    }
  }
  return { px, n };
}

/** Box filter back down to `size`. */
function shrink({ px, n }, size) {
  const out = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let dy = 0; dy < OVER; dy++) {
        for (let dx = 0; dx < OVER; dx++) sum += px[(y * OVER + dy) * n + (x * OVER + dx)];
      }
      out[y * size + x] = Math.round(sum / (OVER * OVER));
    }
  }
  return out;
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 0);
  return Buffer.concat([head, data, tail]);
}

/** 8-bit RGBA, one filter byte per row, deflated. The simplest PNG there is. */
function png(alpha, size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  let at = 0;
  for (let y = 0; y < size; y++) {
    raw[at++] = 0;
    for (let x = 0; x < size; x++) {
      const a = alpha[y * size + x];
      raw[at++] = WHITE[0];
      raw[at++] = WHITE[1];
      raw[at++] = WHITE[2];
      raw[at++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}">` +
  `<circle cx="${SOLID.x}" cy="${SOLID.y}" r="${SOLID.r}" fill="#f2f4f5"/>` +
  `<circle cx="${OPEN.x}" cy="${OPEN.y}" r="${OPEN.r}" fill="none" stroke="#f2f4f5"` +
  ` stroke-width="${OPEN.width}"/></svg>`;

await mkdir('public/brand', { recursive: true });
await writeFile('public/brand/mark.png', png(shrink(paint(SIZE), SIZE), SIZE));
await writeFile('public/brand/mark.svg', svg);
console.log('public/brand/mark.png ' + SIZE + 'x' + SIZE + ' and mark.svg');
