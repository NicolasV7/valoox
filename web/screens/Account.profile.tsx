import { useState } from 'preact/hooks';
import { FlowState } from '../components/Flow.tsx';
import { Mark } from '../components/Mark.tsx';
import { CARDS } from '../data/findable.ts';
import type { Account } from '../data/types.ts';
import { usePiece } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';

export function Profile({ who }: { who: Account | null }) {
  const piece = usePiece(CARDS, who?.card ?? '');
  const [failed, setFailed] = useState(false);
  const art = piece?.wide ?? piece?.tall ?? null;
  const colour = useArt(art);
  const at = who?.name.lastIndexOf('#') ?? -1;
  const s = t().account;
  let ago = '';
  if (who?.seen && Number.isFinite(who.seen)) {
    const hours = Math.max(0, Math.floor((Date.now() / 1000 - who.seen) / 3600));
    ago =
      hours < 1 ? s.justNow : hours < 24 ? s.hoursAgo(hours) : s.daysAgo(Math.floor(hours / 24));
  }
  if (!who)
    return (
      <section class="flow__identity" aria-busy="true">
        <div class="flow__pending flow__pending--card" />
        <div class="flow__identity-copy">
          <span class="flow__pending flow__pending--small" />
          <h2>
            <span class="flow__pending flow__pending--line" />
          </h2>
          <div class="flow__identity-meta">
            <span class="flow__pending flow__pending--small" />
          </div>
        </div>
      </section>
    );
  return (
    <section class="flow__identity stage" style={artStyle(colour)}>
      {art && !failed ? (
        <img
          class="flow__card-art"
          src={art}
          alt=""
          width="350"
          height="144"
          onError={() => setFailed(true)}
        />
      ) : (
        <div class="flow__card-art flow__card-art--empty">
          <Mark size={32} />
        </div>
      )}
      <div class="flow__identity-copy">
        <FlowState kind="ok">{t().flows.connected}</FlowState>
        <h2>
          {at > 0 ? who.name.slice(0, at) : who.name}
          {at > 0 && <span>{who.name.slice(at)}</span>}
        </h2>
        <div class="flow__identity-meta">
          <span class="num">{who.shard?.toUpperCase()}</span>
          {ago && <span>{t().flows.lastUsed(ago)}</span>}
        </div>
      </div>
    </section>
  );
}
