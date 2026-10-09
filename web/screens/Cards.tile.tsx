// One card on the wall. Two columns, and the tile crops rather than shrinks.

import { useState } from 'preact/hooks';
import { StarMark } from '../components/StarMark.tsx';
import type { Card } from '../data/cards.ts';
import { colourOf } from '../design/measure.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

export function Tile({ card, on, mine }: { card: Card; on: boolean; mine: boolean }) {
  // The colour is read off the square, which is the crop the measurement was
  // tuned on and a tenth of the bytes of the painting.
  const [shot, setShot] = useState(() => colourOf(card.small) !== null);
  const lit = useArt(shot ? card.small : null);
  const route = { name: 'card', id: card.id } as const;

  return (
    <div class="leaf stage" style={artStyle(lit)}>
      <a class="hit" href={href(route)} onClick={intercept(route)}>
        <span class="sr">{card.name}</span>
      </a>
      {card.tall && (
        <img
          class="leaf__art"
          src={card.tall}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          onLoad={() => setShot(true)}
        />
      )}
      {on && <span class="leaf__on">{t().common.equipped}</span>}
      <span class="leaf__scrim" />
      <span class="leaf__name">{card.name}</span>
      {/* A thing you do not own is a thing the store can still offer
          you, which is why this is a control and not a mark. */}
      {!mine && (
        <StarMark
          size={15}
          item={{
            id: card.id,
            name: card.name,
            art: lit ?? undefined,
            type: '3f296c07-64c3-494c-923b-fe692a4fa1bd',
          }}
        />
      )}
    </div>
  );
}
