// The QR, and the three things that happen to it: approved, still waiting, or
// dead. One screen rather than four, because they are one moment and the only
// thing that changes is what is on the plate.
//
// The plate is white in both themes and that is not an oversight. A QR inverted
// to match a dark page fails to scan on a good share of phones, and the single
// job of this screen is that it scans on the first try.

import { Check, Clock, Riot } from '../components/icons.tsx';
import { QrCode } from '../components/QrCode.tsx';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

export type ScanState =
  | { phase: 'starting' }
  | { phase: 'ready'; url: string }
  | { phase: 'expired' }
  | { phase: 'approved'; name: string; tag: string };

export function Scan({ state, onRetry }: { state: ScanState; onRetry: () => void }) {
  const s = t().gate;
  if (state.phase === 'approved') return <Approved name={state.name} tag={state.tag} />;
  if (state.phase === 'expired') return <Expired onRetry={onRetry} />;

  return (
    <div class="screen scan">
      <h1>{s.scan.title}</h1>
      <p class="lede scan__lede">{s.scan.lede}</p>

      <div class="plate">
        {state.phase === 'ready' ? (
          <QrCode url={state.url} size={190} />
        ) : (
          // The plate where the code will be, at the size it will be. Nothing
          // to announce: the line under it already says what is happening.
          <div class="plate__wait" aria-hidden="true" />
        )}
      </div>
      <p class="small scan__how">{s.scan.how}</p>

      <div class="rule-or">
        <span class="small">{s.scan.or}</span>
      </div>

      <a class="btn btn--riot" href={state.phase === 'ready' ? state.url : '#'}>
        <Riot />
        {s.scan.open}
      </a>
      <p class="small scan__how">{s.scan.openWhy}</p>

      <div class="scan__waiting">
        <img src={SPRAY.holdUp} alt="" width="76" height="76" />
        <p class="small">
          <span class="dot" /> {s.scan.waiting}
        </p>
      </div>
    </div>
  );
}

function Approved({ name, tag }: { name: string; tag: string }) {
  const s = t().gate;
  return (
    <div class="screen scan">
      <h1>{s.approved.title}</h1>
      <div class="plate plate--done">
        <div class="plate__seal">
          <Check />
        </div>
      </div>

      <div class="scan__who">
        <img src={SPRAY.peace} alt="" width="78" height="78" />
        <p class="item">{s.approved.as(name, tag)}</p>
        <p class="small">{s.approved.loading}</p>
      </div>

      {/* The shape the store rows will take, at the size they will be, so
          nothing jumps when the data lands. */}
      <div class="bars" aria-hidden="true">
        <span class="skel" />
        <span class="skel" />
        <span class="skel" />
      </div>

      <p class="legal scan__foot">{s.approved.nothingTyped}</p>
    </div>
  );
}

function Expired({ onRetry }: { onRetry: () => void }) {
  const s = t().gate;
  return (
    <div class="screen scan">
      <h1>{s.expired.title}</h1>
      <p class="lede scan__lede">{s.expired.lede}</p>

      <div class="plate plate--dead">
        <div class="plate__seal plate__seal--quiet">
          <Clock />
        </div>
      </div>

      <img class="scan__spray" src={SPRAY.goAgain} alt="" width="88" height="88" />
      <button type="button" class="btn" onClick={onRetry}>
        {s.expired.again}
      </button>

      <p class="legal scan__foot">{s.expired.nothingHappened}</p>
    </div>
  );
}
