import type { Theme } from './theme.ts';

export function contain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  cover = false,
): void {
  if (!img) return;
  const scale = (cover ? Math.max : Math.min)(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * scale,
    ih = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

export function text(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  value: string,
  x: number,
  y: number,
  size: number,
  numeric = false,
  colour = theme.ink,
  width = 320,
  weight = 500,
): void {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${numeric ? theme.num : theme.ui}`;
  const glyphs = Array.from(value);
  let shown = value;
  while (ctx.measureText(shown).width > width && glyphs.length) {
    glyphs.pop();
    shown = glyphs.join('').trimEnd() + '…';
  }
  ctx.fillText(shown, x, y);
}

export function panel(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  x: number,
  y: number,
  w: number,
  h: number,
  art: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.clip();
  ctx.fillStyle = theme.stage;
  ctx.fillRect(x, y, w, h);
  const glow = ctx.createRadialGradient(
    x + w * 0.8,
    y + h * 0.3,
    0,
    x + w * 0.8,
    y + h * 0.3,
    w * 0.8,
  );
  glow.addColorStop(0, `rgba(${art},.3)`);
  glow.addColorStop(1, `rgba(${art},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = `rgba(${art},.075)`;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.47, y);
  ctx.lineTo(x + w * 0.62, y);
  ctx.lineTo(x + w * 0.48, y + h);
  ctx.lineTo(x + w * 0.33, y + h);
  ctx.fill();
  ctx.restore();
}
