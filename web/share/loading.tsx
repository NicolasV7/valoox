import { t } from '../i18n/index.ts';
import type { Format } from './model.ts';

const bar = (x: number, y: number, width: number, height: number) => (
  <rect x={x} y={y} width={width} height={height} rx="3" />
);

/** The same intrinsic dimensions and slots as the exported picture, without artwork. */
export function ShareLoading({ format }: { format: Format }) {
  const s = t().share;
  const portrait = format === 'portrait';
  const height = portrait ? 640 : 450;
  const banner = portrait ? 94 : 80;
  const heading = portrait ? 168 : 151;
  return (
    <div class="share__image" role="status">
      <svg
        class="share__poster share__skeleton"
        viewBox={'0 0 360 ' + height}
        width="1080"
        height={height * 3}
        aria-hidden="true"
      >
        <rect class="share__skeleton-ground" width="360" height={height} />
        <text class="share__skeleton-brand" x="20" y="28">
          {s.brand}
        </text>
        <text x="340" y="28" text-anchor="end">
          {s.domain}
        </text>
        <rect class="share__skeleton-panel" x="20" y="46" width="320" height={banner} />
        {bar(175, 58, 150, banner - 24)}
        {bar(34, 46 + banner - 49, 105, 20)}
        {bar(34, 46 + banner - 21, 38, 10)}
        <text class="share__skeleton-label" x="20" y={heading}>
          {t().store.daily}
        </text>
        {bar(292, heading - 8, 48, 7)}
        {[0, 1, 2, 3].map((i) => {
          const x = portrait ? 20 : 20 + (i % 2) * 164;
          const y = portrait ? 184 + i * 92 : 166 + Math.floor(i / 2) * 116;
          return (
            <g key={i}>
              <rect
                class="share__skeleton-panel"
                x={x}
                y={y}
                width={portrait ? 320 : 156}
                height={portrait ? 84 : 108}
              />
              {bar(x + (portrait ? 157 : 10), y + 12, portrait ? 155 : 136, portrait ? 46 : 39)}
              {bar(x + 13, y + (portrait ? 10 : 64), portrait ? 95 : 115, portrait ? 14 : 10)}
              {portrait && bar(x + 13, y + 31, 73, 14)}
              {bar(x + 13, y + (portrait ? 59 : 85), 60, 10)}
            </g>
          );
        })}
        {bar(20, height - 51, 195, 7)}
        <text class="share__skeleton-legal" x="20" y={height - 20}>
          {s.disclaimer}
        </text>
      </svg>
      <span class="share__status">{s.pending}</span>
    </div>
  );
}
