// A card, a spray, a charm or a title, opened.
//
// One screen with four bodies rather than four screens. Everything above the
// name is the same question — what does it look like at the size you will
// actually see it — and the answer is a different size for each kind, because
// a spray is a wall and a charm hangs off a gun.
//
// The light on all four is sampled from the artwork itself. An accessory has
// no rarity, so there is no tier colour to borrow: the only honest source of a
// colour for one of these is the thing itself. The title is the exception
// twice over — it has no artwork at all, so it keeps the neutral weave.

import { Back, STORE } from '../components/Back.tsx';
import { TitleMark } from '../components/icons.tsx';
import { type Coin, Money } from '../components/Money.tsx';
import type { StoreView } from '../data/types.ts';
import { usePiece } from '../data/usePiece.ts';
import { kindOf } from '../design/shapes.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { Crops } from './Piece.card.tsx';
import { PieceLoading } from './Piece.loading.tsx';
import { Store } from './Store.tsx';

export function Piece({ id, view }: { id: string; view: StoreView }) {
  const s = t().piece;
  const sold = priced(view, id);
  const found = usePiece(sold?.type ?? '', id);
  // The frames if it moves, the tall crop if it is a card — displayIcon on a
  // player card is the wide one, and the stage would letterbox it — and
  // otherwise the icon.
  const art = found?.gif ?? found?.tall ?? found?.icon ?? null;
  const lit = useArt(found?.icon);

  // The accessory store rotates weekly and a bundle leaves. A link to a piece
  // that is no longer in either is a screen about a thing that is gone, so it
  // lands on the store rather than waiting forever for a price.
  if (!sold) return <Store view={view} />;
  const kind = kindOf(sold.type);
  if (!found) return <PieceLoading kind={kind} />;

  const name = found.name ?? '';
  const at = name.lastIndexOf(' ');
  const style = artStyle(lit);

  return (
    <main class={lit ? 'screen piece piece--lit' : 'screen piece'} style={style}>
      <Back to={STORE} />

      {/* The item, at the only size that does it justice. A title has no
          artwork of any kind, so it is set rather than shown. */}
      <div class={'piece__stage piece__stage--' + (kind ?? 'card') + ' stage'} style={style}>
        {kind === 'title' ? (
          <span class="piece__word">
            <TitleMark size={54} />
            {name}
          </span>
        ) : (
          art && <img class="piece__art" src={art} alt={name} />
        )}
        {kind === 'title' && <span class="piece__aside">{s.markSays}</span>}
      </div>

      <div class="offer__id">
        <div class="offer__who">
          <h1 class="piece__name">
            {at > 0 && kind !== 'title' ? <span>{name.slice(0, at)}</span> : name}
            {at > 0 && kind !== 'title' && <span>{name.slice(at + 1)}</span>}
          </h1>
          {kind && <p class="piece__kind">{t().common.kind[kind]}</p>}
        </div>

        <div class="offer__paid">
          <span class="piece__price">
            <Money amount={sold.cost} of={sold.coin} size={18} />
          </span>
          <span class="piece__coin">{t().common[sold.coin === 'vp' ? 'vp' : 'kc']}</span>
        </div>
      </div>

      {kind === 'buddy' && (
        <dl class="facts facts--boxed">
          <Fact term={s.kind} said={t().common.kind.buddy} />
          <Fact term={s.goesOn} said={s.oneAtATime} />
          <Fact term={s.yours} said={sold.owned ? s.yes : s.no} quiet={!sold.owned} />
        </dl>
      )}

      {kind === 'card' && found.wide && found.small && (
        <Crops piece={found} who={view.account.name} />
      )}

      <p class="legal piece__note">{note(kind, !!found.gif)}</p>
    </main>
  );
}

function Fact({ term, said, quiet }: { term: string; said: string; quiet?: boolean }) {
  return (
    <div class="facts__box">
      <dt>{term}</dt>
      <dd class={quiet ? 'faint' : undefined}>{said}</dd>
    </div>
  );
}

/** What this kind of thing is, and what Riot does and does not publish for it.
 *  Four different facts, so four different sentences. */
function note(kind: string | null, moves: boolean): string {
  const s = t().piece;
  if (kind === 'buddy') return s.buddyNote;
  if (kind === 'card') return s.cardNote;
  if (kind === 'title') return s.titleNote;
  return moves ? s.sprayMoves : s.sprayNote;
}

/** Which slot this piece was opened from, what it costs there, and in which
 *  money. That last one is not decoration: the weekly accessory store sells in
 *  Kingdom Credits and a bundle prices the same kinds of piece in VP, so the
 *  coin is a fact about the door you came through rather than about the thing. */
function priced(
  view: StoreView,
  id: string,
): { type: string; cost: number | null; coin: Coin; owned?: boolean } | null {
  const weekly = view.accessory?.items.find((it) => it.id === id);
  if (weekly) return { type: weekly.type, cost: weekly.cost, coin: 'kc', owned: weekly.owned };

  const packed = view.bundles.flatMap((b) => b.items).find((it) => it.id === id);
  if (packed) {
    return {
      type: packed.type,
      cost: packed.price ?? packed.base,
      coin: 'vp',
      owned: packed.owned,
    };
  }

  return null;
}
