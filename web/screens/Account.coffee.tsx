// The one card on any screen that asks for something.
//
// It is last-but-one on purpose: everything above it is the app explaining
// itself, and a card that asks for money before it has earned the reading is
// the thing this whole screen is trying not to be.
//
// The board draws a progress bar — "$6 of $10 this month" — and it is the one
// element on it that is not here. There is no number behind it: Buy Me a
// Coffee publishes no total this app can read, and inventing one on the screen
// whose entire argument is that its claims are checkable would cost more than
// a progress bar is worth. The card says what it can back and stops.

import { SPRAY } from '../design/sprays.ts';
import { artStyle } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';

/** Buy Me a Coffee's own yellow, which the weave is tinted with. Fixed rather
 *  than measured: every other weave in this app takes its colour from a piece
 *  of Riot's art, and this one is about somebody else's brand. */
const YELLOW = '255, 221, 0';

export function Coffee({ to }: { to: string }) {
  const s = t().account;

  return (
    <>
      <h2 class="label deck__band">{s.coffee}</h2>
      <div class="cup" style={artStyle(YELLOW)}>
        {/* Wingman For The Win: the little bot celebrating. */}
        <img class="cup__who" src={SPRAY.wingman} alt="" width="158" height="158" />
        <div class="cup__said">
          <p class="cup__title">{s.coffeeSaid}</p>
          <p class="cup__why">{s.coffeeUnder}</p>
        </div>
        {/* A plain link off this page, which is the whole of what the note
            under the card promises. No referrer leaves this origin either —
            see Referrer-Policy in public/_headers. */}
        <a class="cup__go" href={to} target="_blank" rel="noopener noreferrer">
          <Cup />
          {s.coffeeButton}
        </a>
      </div>
      <p class="legal deck__note">{s.coffeeNote}</p>
    </>
  );
}

/** A takeaway cup with steam. Drawn here rather than in icons.tsx because it
 *  is the only place in the app that needs one. */
function Cup() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M16 9h2.2a2.8 2.8 0 0 1 0 5.6H16" />
      <path d="M7 4.6v1.2M10.5 4v1.8M14 4.6v1.2" />
    </svg>
  );
}
