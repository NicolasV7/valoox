// Test refused.
//
// Both doors shut, with a plain statement of what a send does and does not
// prove. What is NOT on it is the provider's own string: `resend 422` reads
// as a fault code to look up, and the only two outcomes that change what to
// do about it are already the two branches of this screen.
//
// Three outcomes, two doors. A 4xx came back before anything was sent and
// may be a typo, so another code is worth a try. A bounce came back after
// the far end looked at the address and said no, and a suppression is the
// channel declining to try because one of those already happened — for both
// of those, sending the same thing again is the one piece of advice that
// cannot help, so that button is gone and the only way on is a different
// address.

import { useState } from 'preact/hooks';
import { Check, Mail } from '../components/icons.tsx';
import { again, reload, usePrefs } from '../data/channel.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';
import { go } from '../route.ts';

export function AlertsFailed() {
  const s = t().alerts;
  const prefs = usePrefs();
  const [busy, setBusy] = useState(false);
  const said = prefs?.mail?.said ?? '';
  // Which of the three, in the order they can be told apart: the channel
  // declining to try at all, the far end sending it back, or the address
  // being rejected before anything left.
  //
  // `again` is part of the same table rather than derived from it: whether
  // another code could land is a property of which outcome this is, and
  // working it out a second way is how the button and the sentence above it
  // end up disagreeing.
  const fate =
    said === 'email.suppressed'
      ? { word: s.wasBlocked, lede: s.blockedLede, why: s.blockedWhy, again: false }
      : said === 'email.bounced' || said === 'email.complained'
        ? { word: s.wasBounced, lede: s.bouncedLede, why: s.bouncedWhy, again: false }
        : { word: s.wasRefused, lede: s.refusedLede, why: s.refusedWhy, again: true };

  return (
    <main class="screen bell">
      <header class="bell__head bell__head--said">
        <h1>{t().common.nav.alerts}</h1>
        {/* Sova, grinning and sweating. The send did not work, and that is
            ours to say rather than a fault to report. */}
        <img class="bell__sticker" src={SPRAY.sorry} alt="" width="84" height="84" />
        <p class="small">{fate.lede}</p>
      </header>

      <div class="bell__card bell__card--bad">
        <p class="bell__kind">
          <Mail />
          {s.email}
          <span class="bell__state bell__state--bad">
            <span class="bell__dot" />
            {fate.word}
          </span>
        </p>
        <p class="lede bell__said">{fate.why}</p>
        <p class="bell__addr num">{prefs?.mail?.to ?? ''}</p>
      </div>

      <div class="bell__pair">
        {fate.again && (
          <button type="button" class="btn" disabled={busy} onClick={more}>
            {s.sendAnother}
          </button>
        )}
        <button
          type="button"
          class={fate.again ? 'btn btn--quiet' : 'btn'}
          onClick={() => go({ name: 'alerts', step: 'channel' })}
        >
          {s.editAddress}
        </button>
      </div>

      <p class="legal bell__note">{s.oneChannelMeans}</p>
      <p class="legal bell__note">{s.codeIsTheirs}</p>

      <h2 class="label bell__step">{s.canAndCannot}</h2>
      <div class="shelf">
        <p class="tells">
          <span class="tells__yes">
            <Check size={13} />
          </span>
          {s.canTell}
        </p>
        <p class="tells tells__no">
          <span>—</span>
          {s.cannotTell}
        </p>
      </div>
    </main>
  );

  async function more() {
    setBusy(true);
    const res = (await again()) as { sent?: boolean };
    setBusy(false);
    await reload();
    if (res?.sent) go({ name: 'alerts', step: 'code' });
  }
}
