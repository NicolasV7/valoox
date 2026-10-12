import { FLOW } from '../design/flows.ts';
import { artStyle } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';

const YELLOW = '255, 221, 0';

export function Coffee({ to }: { to: string }) {
  const f = t().flows;
  const s = t().account;
  return (
    <section class="flow__coffee">
      <div>
        <span class="label">{s.coffee}</span>
        <h2>{f.coffeeTitle}</h2>
        <p class="small">{f.coffeeLead}</p>
        <a class="btn" style={artStyle(YELLOW)} href={to} target="_blank" rel="noopener noreferrer">
          {s.coffeeButton}
        </a>
      </div>
      <img src={FLOW.support} alt="" width="86" height="92" />
    </section>
  );
}
