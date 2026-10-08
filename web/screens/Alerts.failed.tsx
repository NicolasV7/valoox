// Test refused.
//
// Both doors shut, with a plain statement of what a send does and does not
// prove. What is NOT on it is the provider's own string: `resend 422` reads
// as a fault code to look up, and the only two outcomes that change what to
// do about it are already the two branches of this screen.
//
// Which door is open depends on who refused it. A 4xx came back before
// anything was sent and may be a typo, so another code is worth a try. A
// bounce came back after the far end looked at the address and said no, and
// sending the same thing again is the one piece of advice that cannot help —
// so that button is gone and the only way on is a different address.

import { useState } from 'preact/hooks';
import { Check, Mail } from '../components/icons.tsx';
import { again, reload, usePrefs } from '../data/channel.ts';
import { t } from '../i18n/index.ts';
import { go } from '../route.ts';

export function AlertsFailed() {
  const s = t().alerts;
  const prefs = usePrefs();
  const [busy, setBusy] = useState(false);
  const said = prefs?.mail?.said ?? '';
  // The far end refused it, rather than the provider refusing to try.
  const bounced = said === 'email.bounced' || said === 'email.complained';

  return (
    <main class="screen bell">
      <header class="bell__head">
        <h1>{t().common.nav.alerts}</h1>
        <p class="small">{bounced ? s.bouncedLede : s.refusedLede}</p>
      </header>

      <div class="bell__card bell__card--bad">
        <p class="bell__kind">
          <Mail />
          {s.email}
          <span class="bell__state bell__state--bad">
            <span class="bell__dot" />
            {bounced ? s.wasBounced : s.wasRefused}
          </span>
        </p>
        <p class="lede bell__said">{bounced ? s.bouncedWhy : s.refusedWhy}</p>
        <p class="bell__addr num">{prefs?.mail?.to ?? ''}</p>
      </div>

      <div class="bell__pair">
        {!bounced && (
          <button type="button" class="btn" disabled={busy} onClick={more}>
            {s.sendAnother}
          </button>
        )}
        <button
          type="button"
          class={bounced ? 'btn' : 'btn btn--quiet'}
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
