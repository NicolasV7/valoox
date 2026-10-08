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
import { QrCode } from '../components/QrCode.tsx';
import { Thinking } from '../components/Thinking.tsx';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

/** How often the Worker asks Riot whether the phone has approved it.
 *
 *  Exported because the waiting indicator rings out on exactly this beat, and
 *  two numbers that have to match are one number. */
export const POLL_EVERY = 2000;

export type ScanState =
  | { phase: 'starting' }
  | { phase: 'ready'; url: string }
  // The url rides along into both endings. The code is spent either way, but it
  // is still the thing that was on screen a second ago, and a plate that empties
  // to white loses the only continuity the three phases have.
  | { phase: 'expired'; url?: string }
  | { phase: 'approved'; url?: string };

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
  if (state.phase === 'approved') return <Approved name={name} url={state.url} />;
  if (state.phase === 'expired') return <Expired url={state.url} onRetry={onRetry} />;

  return (
    <div class="scan rise">
      <h1>{s.scan.title}</h1>
      <p class="lede scan__lede">{s.scan.lede}</p>

      <div class="plate">
        {/* Nothing until the code is here. The plate holds its size, so the
            screen does not move when it lands — an empty white square is a
            better wait than a shape that has to be replaced. */}
        {state.phase === 'ready' && (
          <span class="plate__code">
            <QrCode url={state.url} size={190} />
          </span>
        )}
      </div>
      <p class="small scan__how">{s.scan.how}</p>

      <div class="rule-or">
        <span class="small">{s.scan.or}</span>
      </div>

      {/* This tab, deliberately. The url is a universal link, and iOS only
          hands one to the app on a plain same-tab navigation — opened in a new
          tab Safari keeps it and shows Riot's web page instead, which is the
          app not opening.
          
          With the app installed nothing navigates at all: iOS switches to it
          and this page is simply backgrounded, so the poll survives and the
          visibilitychange handler in sign-in.ts asks again the moment you come
          back. Without the app, the navigation to Riot's own login is the right
          fallback anyway. */}
      <a
        class="btn btn--riot"
        href={state.phase === 'ready' ? state.url : undefined}
        aria-disabled={state.phase === 'ready' ? undefined : 'true'}
      >
        <Riot />
        {s.scan.open}
      </a>
      <p class="small scan__how">{s.scan.openWhy}</p>

      <div class="scan__waiting">
        <img src={SPRAY.holdUp} alt="" width="76" height="76" />
        <p class="small waiting">
          {/* The ring leaves the dot once per poll. It is the request going
              out, drawn — not a spinner filling time. */}
          <span class="dot" style={{ animationDuration: POLL_EVERY + 'ms' }} />
          <Thinking>{s.scan.waiting}</Thinking>
        </p>
      </div>
    </div>
  );
}

function Approved({ name, url }: { name?: string; url?: string }) {
  const s = t().gate;
  const [handle, tag] = (name ?? '').split('#');

  return (
    <div class="scan rise">
      <h1>{s.approved.title}</h1>
      <div class="plate plate--done">
        {/* The code that was just used, spent: still there, no longer readable.
            A plate that empties to white loses the only thread between the
            three phases. */}
        {url && (
          <span class="plate__spent">
            <QrCode url={url} size={190} />
          </span>
        )}
        <span class="plate__seal">
          <Check />
        </span>
      </div>

      <div class="scan__who">
        <img src={SPRAY.peace} alt="" width="78" height="78" />
        {/* The name arrives with the store, loading underneath this screen —
            a full Riot round trip, so it is a second or two. Until then the
            line is a placeholder at the size the name will be, rather than
            nothing: final sizes, always, so the handle lands in place instead
            of pushing everything under it down a line. */}
        {handle ? (
          <p class="item scan__name">
            {handle}
            {tag && <span class="scan__tag">#{tag}</span>}
          </p>
        ) : (
          <p class="item scan__name">
            <span class="skel scan__name--waiting" />
          </p>
        )}
        <p class="small">
          <Thinking>{s.approved.loading}</Thinking>
        </p>
      </div>

      <div class="bars bars--waiting" aria-hidden="true">
        <span class="skel" />
        <span class="skel" />
        <span class="skel" />
      </div>

      <p class="legal scan__foot">{s.approved.nothingTyped}</p>
    </div>
  );
}

function Expired({ url, onRetry }: { url?: string; onRetry: () => void }) {
  const s = t().gate;
  return (
    <div class="scan rise">
      <h1>{s.expired.title}</h1>
      <p class="lede scan__lede">{s.expired.lede}</p>

      {/* Greyed rather than gone, so you can see WHAT expired. */}
      <div class="plate plate--dead">
        {url && (
          <span class="plate__spent">
            <QrCode url={url} size={190} />
          </span>
        )}
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
