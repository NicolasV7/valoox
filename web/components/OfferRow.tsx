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
// The name breaks before the weapon, always. A VALORANT skin is called
// "<something> <weapon>" — Reaver Vandal, Champions 2026 Dagger — and the
// weapon is the word you are scanning the column for. Letting the line wrap
// where it happens to run out puts it on the first line in a short name and
// the second in a long one, so the one word you are looking for moves between
// rows. Splitting at the last space pins it.

import type { Tier } from '../data/tiers.ts';
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
  scale = 1,
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
  /** How long this weapon really is, relative to the longest. */
  scale?: number;
  href: string;
  onClick?: (e: MouseEvent) => void;
}) {
  const art = useArt(render);
  // Two things the row hands to CSS: the colour measured off the render, and
  // how much of the row that render is allowed to take.
  const style = { ...artStyle(art), '--gun': String(scale) } as Record<string, string>;
  // A price that was something else wants both numbers, which no longer fits
  // under the name — so it moves to the far corner and stacks there instead.
  const cut = was != null && was !== cost;

  return (
    <a class={cut ? 'row row--cut stage' : 'row stage'} style={style} href={href} onClick={onClick}>
      {render && <img class="row__art" src={render} alt="" loading="lazy" />}

      {tier && (
        <span class={'row__tier row__tier--' + tier.name}>
          <img src={tier.icon} alt="" width="14" height="14" />
          {t().common.tier[tier.name]}
        </span>
      )}

      {/* A hole where the name will be, not the word "loading". The name is
          the thing you came to read; a placeholder that reads as a word is
          something to read instead of it, and it is the wrong one. Two bars at
          the widths the skeleton screen uses, so a row that fills late looks
          like the rows that were never filled. */}
      <span class="row__name">
        {name ? (
          split(name)
        ) : (
          <>
            <span class="skel" style={{ width: '118px', height: '18px' }} />
            <span class="skel" style={{ width: '92px', height: '18px', marginTop: '4px' }} />
          </>
        )}
      </span>

      <span class="row__price">
        {cut && <Money amount={was} struck size={11} bare={bare} />}
        <Money amount={cost} size={14} bare={bare} />
      </span>
    </a>
  );
}

/** The skin line, then the weapon. A name with no space in it stays whole. */
function split(name: string) {
  const at = name.lastIndexOf(' ');
  if (at < 1) return name;
  return (
    <>
      <span>{name.slice(0, at)}</span>
      <span>{name.slice(at + 1)}</span>
    </>
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
