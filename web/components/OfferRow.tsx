// The letterbox row: a rifle, on its own colour.
//
// This is the shape the whole app is built around, and the colour behind it is
// the reason a column of four offers reads as four things rather than one dark
// block. It is measured off the render — see design/measure.ts — so the same
// skin looks like the same object here, in the collection and in an alert.
//
// Three things stacked against the art: what kind of skin it is, what it is
// called, what it costs. The tier leads because it is the one word that says
// how much this is going to hurt before the number does.
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
  bare = false,
  href,
  onClick,
}: {
  name: string | null;
  render: string | null;
  tier: Tier | null;
  cost: number | null;
  was?: number | null;
  /** Without the coin, where the screen has already said which one it is. */
  bare?: boolean;
  href: string;
  onClick?: (e: MouseEvent) => void;
}) {
  const art = useArt(render);
  // A price that was something else wants both numbers, which no longer fits
  // under the name — so it moves to the far corner and stacks there instead.
  const cut = was != null && was !== cost;

  return (
    <a
      class={cut ? 'row row--cut stage' : 'row stage'}
      style={artStyle(art)}
      href={href}
      onClick={onClick}
    >
      {render && <img class="row__art" src={render} alt="" loading="lazy" />}

      {tier && (
        <span class={'row__tier row__tier--' + tier.name}>
          <img src={tier.icon} alt="" width="14" height="14" />
          {t().common.tier[tier.name]}
        </span>
      )}

      <span class="row__name">{name ?? t().common.loading}</span>

      <span class="row__price">
        {cut && <Money amount={was} struck size={11} bare={bare} />}
        <Money amount={cost} size={14} bare={bare} />
      </span>
    </a>
  );
}

/** The same row with nothing in it yet, at the size the real one will be, so
 *  nothing jumps when the data lands. */
export function OfferRowLoading() {
  return (
    <div class="row row--waiting" aria-hidden="true">
      <span class="skel" style={{ width: '38%', height: '11px' }} />
      <span class="skel" style={{ width: '58%', height: '15px' }} />
      <span class="skel" style={{ width: '30%', height: '14px' }} />
    </div>
  );
}
