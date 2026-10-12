import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';

export function Coffee({ to }: { to: string }) {
  const f = t().flows;
  const s = t().account;
  return (
    <section class="flow__coffee">
      <div>
        <span class="label">{s.coffee}</span>
        <h2>{f.coffeeTitle}</h2>
        <p class="small">{f.coffeeLead}</p>
        <a class="btn btn--quiet" href={to} target="_blank" rel="noopener noreferrer">
          {s.coffeeButton}
        </a>
      </div>
      <img src={FLOW.support} alt="" width="86" height="92" />
    </section>
  );
}
