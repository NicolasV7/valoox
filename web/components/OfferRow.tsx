// The letterbox row: a rifle, on its own colour.
//
// This is the shape the whole app is built around, and the colour behind it is
// the reason a column of four offers reads as four things rather than one dark
// block. It is measured off the render — see design/measure.ts — so the same
// skin looks like the same object here, in the collection and in an alert.
//
// The name wraps rather than truncating. "Prelude to Chaos Vandal" at one line
// is three characters and an ellipsis, which is not a name.

import type { Tier } from '../data/catalogue.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { Money } from './Money.tsx';

export function OfferRow({
  name,
  render,
  tier,
  cost,
  was,
  href,
  onClick,
}: {
  name: string | null;
  render: string | null;
  tier: Tier | null;
  cost: number | null;
  was?: number | null;
  href: string;
  onClick?: (e: MouseEvent) => void;
}) {
  const art = useArt(render);

  return (
    <a class="row stage" style={artStyle(art)} href={href} onClick={onClick}>
      {render && <img class="row__art" src={render} alt="" loading="lazy" />}

      <span class="row__foot">
        <span class="row__id">
          <span class="row__name">{name ?? t().common.loading}</span>
          {tier && (
            <span class="row__tier">
              <img src={tier.icon} alt="" width="12" height="12" />
              {t().common.tier[tier.name]}
            </span>
          )}
        </span>

        <span class="row__price">
          {was != null && was !== cost && <Money amount={was} struck size={11} />}
          <Money amount={cost} />
        </span>
      </span>
    </a>
  );
}

/** The same row with nothing in it yet, at the size the real one will be, so
 *  nothing jumps when the data lands. */
export function OfferRowLoading() {
  return (
    <div class="row row--waiting" aria-hidden="true">
      <span class="row__foot">
        <span class="row__id">
          <span class="skel" style={{ width: '58%', height: '15px' }} />
          <span class="skel" style={{ width: '34%', height: '11px', marginTop: '6px' }} />
        </span>
      </span>
    </div>
  );
}
