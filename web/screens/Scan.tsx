// The QR, and the three things that happen to it: approved, still waiting, or
// dead. One screen rather than four, because they are one moment and the only
// thing that changes is what is on the plate.
//
// The plate is white in both themes and that is not an oversight. A QR inverted
// to match a dark page fails to scan on a good share of phones, and the single
// job of this screen is that it scans on the first try. It is the same 218px
// square in every phase, so the code, the tick and the clock all land in the
// same place and the screen changes without anything jumping.

import { Check, Clock, Riot } from '../components/icons.tsx';
import { QrCode, QrWaiting } from '../components/QrCode.tsx';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

export type ScanState =
  | { phase: 'starting' }
  | { phase: 'ready'; url: string }
  | { phase: 'expired' }
  | { phase: 'approved' };

export function Scan({
  state,
  name,
  onRetry,
}: {
  state: ScanState;
  name?: string;
  onRetry: () => void;
}) {
  const s = t().gate;
  if (state.phase === 'approved') return <Approved name={name} />;
  if (state.phase === 'expired') return <Expired onRetry={onRetry} />;

  return (
    <div class="scan rise">
      <h1>{s.scan.title}</h1>
      <p class="lede scan__lede">{s.scan.lede}</p>

      <div class="plate">
        {state.phase === 'ready' ? (
          <span class="plate__code">
            <QrCode url={state.url} size={190} />
          </span>
        ) : (
          <QrWaiting size={190} />
        )}
      </div>
      <p class="small scan__how">{s.scan.how}</p>

      <div class="rule-or">
        <span class="small">{s.scan.or}</span>
      </div>

      {/* A new tab, not this one. Riot Mobile opens from a universal link, and
          if that link navigates the page away the poll dies with it — the scan
          is approved, nobody is listening, and coming back lands on a reload
          that never shows the screen saying you got in. */}
      <a
        class="btn btn--riot"
        href={state.phase === 'ready' ? state.url : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={state.phase === 'ready' ? undefined : 'true'}
      >
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

function Approved({ name }: { name?: string }) {
  const s = t().gate;
  const [handle, tag] = (name ?? '').split('#');

  return (
    <div class="scan rise">
      <h1>{s.approved.title}</h1>
      <div class="plate plate--done">
        <span class="plate__seal">
          <Check />
        </span>
      </div>

      <div class="scan__who">
        <img src={SPRAY.peace} alt="" width="78" height="78" />
        {/* The name arrives with the store, which is loading underneath this.
            If it beats the hold it fills in; if it does not, the line below
            already says what is happening. */}
        {handle && (
          <p class="item scan__name">
            {handle}
            {tag && <span class="scan__tag">#{tag}</span>}
          </p>
        )}
        <p class="small">{s.approved.loading}</p>
      </div>

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
    <div class="scan rise">
      <h1>{s.expired.title}</h1>
      <p class="lede scan__lede">{s.expired.lede}</p>

      <div class="plate plate--dead">
        <span class="plate__seal plate__seal--quiet">
          <Clock />
        </span>
      </div>

      <img class="scan__spray" src={SPRAY.goAgain} alt="" width="88" height="88" />
      <button type="button" class="btn" onClick={onRetry}>
        {s.expired.again}
      </button>

      <p class="legal scan__foot">{s.expired.nothingHappened}</p>
    </div>
  );
}
