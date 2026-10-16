import { locale, t } from '../i18n/index.ts';
import type { Assets } from './assets.ts';
import { type Format, identity, type Snapshot } from './model.ts';
import { clip, contain, panel, text } from './paint.ts';
import type { Theme } from './theme.ts';

export function poster(
  source: Snapshot,
  assets: Assets,
  format: Format,
  tag: boolean,
  theme: Theme,
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = format === 'portrait' ? 1920 : 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  const s = t().share;
  const portrait = format === 'portrait';
  const height = canvas.height / 3;
  const label = (
    value: string,
    x: number,
    y: number,
    size: number,
    numeric = false,
    colour = theme.ink,
    width = 320,
  ) => text(ctx, theme, value, x, y, size, numeric, colour, width);
  ctx.scale(3, 3);
  ctx.save();
  clip(ctx, 0, 0, 360, height, theme.outerRadius);
  ctx.fillStyle = theme.page;
  ctx.fillRect(0, 0, 360, height);
  ctx.strokeStyle = theme.hatch;
  ctx.lineWidth = 0.5;
  for (let x = -height; x < 360 + height; x += 7) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  label(s.brand, 20, 28, 15);
  ctx.textAlign = 'right';
  label(s.domain, 340, 28, 11, true, theme.muted);
  ctx.textAlign = 'left';
  const bh = portrait ? 94 : 80;
  ctx.save();
  clip(ctx, 20, 46, 320, bh, theme.radius);
  ctx.fillStyle = theme.stage;
  ctx.fillRect(20, 46, 320, bh);
  ctx.globalAlpha = 0.65;
  contain(ctx, assets.banner, 20, 46, 320, bh, { cover: true });
  ctx.globalAlpha = 1;
  const mask = ctx.createLinearGradient(20, 46, 340, 46 + bh);
  mask.addColorStop(0, theme.page);
  mask.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = mask;
  ctx.fillRect(20, 46, 320, bh);
  ctx.globalAlpha = 1;
  const [name, suffix] = identity(source.name, tag);
  label(name || s.myStore, 34, 46 + bh - (suffix ? 29 : 20), 28, false, theme.ink, 292);
  if (suffix) label(suffix, 34, 46 + bh - 10, 13, true, theme.muted, 292);
  ctx.restore();
  const date = new Intl.DateTimeFormat(locale(), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(source.fetchedAt * 1000);
  label(t().store.daily, 20, portrait ? 168 : 151, 12, false, theme.muted, 230);
  ctx.textAlign = 'right';
  label(date, 340, portrait ? 168 : 151, 11, true, theme.muted, 85);
  ctx.textAlign = 'left';
  assets.offers.forEach((offer, i) => {
    const x = portrait ? 20 : 20 + (i % 2) * 164;
    const y = portrait ? 184 + i * 92 : 166 + Math.floor(i / 2) * 116;
    const w = portrait ? 320 : 156,
      h = portrait ? 84 : 108;
    ctx.save();
    clip(ctx, x, y, w, h, theme.radius);
    panel(ctx, theme, x, y, w, h, offer.colour);
    contain(
      ctx,
      offer.image,
      portrait ? x + 157 : x + 8,
      y + (portrait ? 10 : 4),
      portrait ? 155 : 140,
      portrait ? 64 : 60,
      // A shared area target balances wide pistols against taller melee silhouettes.
      portrait ? {} : { area: 5040 },
    );
    if (portrait) {
      ctx.save();
      const shade = ctx.createLinearGradient(x, 0, x + 245, 0);
      shade.addColorStop(0, theme.stage);
      shade.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
      const at = offer.name.lastIndexOf(' ');
      label(
        at > 0 ? offer.name.slice(0, at) : offer.name,
        x + 13,
        y + 23,
        18,
        false,
        theme.ink,
        132,
      );
      // Keep all text left of the artwork, including long names and unknown prices.
      if (at > 0) label(offer.name.slice(at + 1), x + 13, y + 43, 18, false, theme.ink, 132);
      label(s.price(offer.cost), x + 13, y + 69, 14, true, theme.ink, 132);
    } else {
      label(offer.name, x + 10, y + 80, 13, false, theme.ink, 136);
      label(s.price(offer.cost), x + 10, y + 99, 14, true, theme.ink, 136);
    }
    ctx.restore();
  });
  const until = new Intl.DateTimeFormat(locale(), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(source.until);
  label(s.until(until), 20, height - 43, 11, false, theme.muted);
  label(s.disclaimer, 20, height - 20, 11, false, theme.faint);
  ctx.restore();
  canvas.className = 'share__poster';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    s.description(
      name + suffix,
      assets.offers.map((o) => s.item(o.name, s.price(o.cost))).join('; '),
    ),
  );
  return canvas;
}
