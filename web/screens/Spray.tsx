// One spray, opened from the collection.
//
// Not the same screen as a spray in the store: that one is about what it costs
// and this one is about what you have. So there is no price here, and in its
// place the two things this app can actually answer — where the colour behind
// it came from, and which of the four wheel slots it is in.
//
// It resolves its own uuid rather than reading the index the tab downloaded: a
// link to /spray/<uuid> opened cold should not cost the whole catalogue to
// show one picture.

import { Back, SPRAYS } from '../components/Back.tsx';
import { bare } from '../data/sprays.ts';
import type { Inventory } from '../data/types.ts';
import { usePiece } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { SPRAY } from './Sprays.tsx';

export function Spray({ id, inv }: { id: string; inv: Inventory }) {
  const s = t().sprays;
  const found = usePiece(SPRAY, id);
  // The frames if it moves, the still otherwise. The colour is always read off
  // the still: a gif's first frame is wherever Riot started the loop.
  const art = found?.gif ?? found?.icon ?? null;
  const lit = useArt(found?.icon);
  const name = found ? bare(found.name ?? '') : null;
  const slot = (inv.worn?.sprays ?? []).indexOf(id) + 1;

  const style = artStyle(lit);
  const says = [
    t().common.kind.spray,
    slot > 0 ? t().common.equipped : null,
    slot > 0 ? s.slot(slot) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <main class={lit ? 'screen piece piece--lit' : 'screen piece'} style={style}>
      <Back to={SPRAYS} />

      <div class="wall__stage stage" style={style}>
        {art && <img class="wall__art" src={art} alt={name ?? ''} crossOrigin="anonymous" />}
      </div>

      <h1 class="wall__name">{name ?? <span class="skel wall__name--waiting" />}</h1>
      <p class="wall__is">
        {/* The colour, as itself. A swatch is the one place a measured value
            can be shown rather than only described. */}
        <span class="wall__chip" style={style} />
        <span class="num">{says}</span>
      </p>

      {/* Both held until there is a number to put in the sentence, rather than
          a heading over a gap. It arrives the frame after the art decodes. */}
      {lit && (
        <>
          <h2 class="label wall__head">{s.colourFrom}</h2>
          <p class="legal">{s.colourWhy(lit)}</p>
        </>
      )}

      <h2 class="label wall__head">{s.canSay}</h2>
      <p class="legal">{s.canSayWhy}</p>

      {found?.gif && <p class="legal wall__note">{s.moves}</p>}
    </main>
  );
}
