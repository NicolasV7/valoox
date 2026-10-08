// The arithmetic, and the part the storefront leaves out.
//
// Three rows because three numbers were read rather than worked out: Riot's
// TotalBaseCost, Riot's TotalDiscountedCost, and the percentage between them —
// which is the only one computed here, and only because it is the one a person
// actually wants and Riot does not send.

import { Money } from '../components/Money.tsx';
import type { Bundle } from '../data/types.ts';
import { locale, t } from '../i18n/index.ts';

export function Totals({ bundle }: { bundle: Bundle }) {
  const s = t().bundle;
  const full = bundle.base;
  const now = bundle.price ?? bundle.base;
  const cut =
    full != null && now != null && full > 0 && now < full
      ? Math.round((1 - now / full) * 100)
      : null;

  return (
    <div class="totals">
      <div class="totals__row">
        <span>{s.full(bundle.items.length)}</span>
        <span class="num totals__was">{full === null ? '—' : full.toLocaleString(locale())}</span>
      </div>

      {cut !== null && (
        <div class="totals__row">
          <span>{s.cut}</span>
          <span class="num totals__cut">{t().store.discount(cut)}</span>
        </div>
      )}

      <div class="totals__row">
        <span class="totals__label">{s.total}</span>
        <span class="totals__sum">
          <Money amount={now} size={16} />
        </span>
      </div>
    </div>
  );
}
