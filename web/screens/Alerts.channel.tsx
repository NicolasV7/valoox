// Where it goes.
//
// One channel: an address, proved. The test button and the proof are the same
// action, because a notifier that will mail any address on request is a spam
// cannon with somebody else's return label on it.
//
// The address is checked here before the button does anything, and checked
// again by the Worker, which is the one that counts. What this one buys is the
// difference between being told now and being told after a round trip.

import { useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { Mail } from '../components/icons.tsx';
import { again, open, refused, reload, usePrefs } from '../data/channel.ts';
import { t } from '../i18n/index.ts';
import { ALERTS, go } from '../route.ts';

/** The same shape the Worker uses, for the same reason it is not RFC 5322:
 *  the real check is whether a code comes back. */
const ADDRESS = /^[^\s@,;:<>"']{1,64}@[^\s@,;:<>"'.]{1,63}(\.[^\s@,;:<>"'.]{1,63})+$/;

export function AlertsChannel() {
  const s = t().alerts;
  const prefs = usePrefs();
  const [to, setTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<string | null>(null);

  const now = to ?? prefs?.mail?.to ?? '';
  const ok = prefs?.mail?.ok === true && now === prefs.mail.to;
  const bad = refused(prefs?.mail?.said);
  const valid = ADDRESS.test(now.trim()) && now.trim().length <= 254;

  return (
    <main class="screen bell">
      <Back to={ALERTS} said={t().common.nav.alerts} />
      <h1 class="bell__title">{s.whereItGoes}</h1>

      <div class={bad ? 'bell__card bell__card--bad' : 'bell__card'}>
        <p class="bell__kind">
          <Mail />
          {s.email}
          <span class={state(ok, bad)}>
            <span class="bell__dot" />
            {ok ? s.verified : bad ? (prefs?.mail?.said ?? '') : s.notVerified}
          </span>
        </p>

        <label class="bell__label" for="addr">
          {s.anAddress}
        </label>
        <input
          id="addr"
          type="email"
          inputMode="email"
          autocomplete="email"
          spellcheck={false}
          class="bell__input"
          value={now}
          onInput={(e) => {
            setTo((e.currentTarget as HTMLInputElement).value);
            setSaid(null);
          }}
        />

        <button type="button" class="btn bell__go" disabled={!valid || busy} onClick={start}>
          {busy ? t().common.loading : s.sendATest}
        </button>

        <p class={said ? 'bell__why bell__why--bad' : 'bell__why'}>
          <span class="bell__dot" />
          <span>{said ?? s.testIsProof}</span>
        </p>
      </div>

      <p class="legal bell__note">{s.oneChannel}</p>
      <p class="legal bell__note">{s.whyACode}</p>
      <p class="legal bell__note">{s.changeItLater}</p>
    </main>
  );

  async function start() {
    setBusy(true);
    setSaid(null);
    const address = now.trim();
    // Re-sending to the address already stored is the same button, so it uses
    // the route that does not need the address handed to it again.
    const res = address === prefs?.mail?.to ? await again() : await open(address);
    setBusy(false);
    if (typeof res !== 'object' || res === null) return;

    const out = res as { error?: string; wait?: number; sent?: boolean; said?: string };
    if (out.error === 'wait') return setSaid(s.waitSeconds(out.wait ?? 0));
    if (out.error === 'address') return setSaid(s.badAddress);
    await reload();

    // It went: the next screen is the one that asks for the code.
    if (out.sent) return go({ name: 'alerts', step: 'code' });
    // The provider refused the address itself, which is a screen of its own
    // because the useful next move is not on this one.
    if (refused(out.said)) return go(ALERTS);
    // Anything else — a 5xx, a timeout, our own key missing — is not the
    // address's fault, so it stays here with the word the provider used.
    setSaid(out.said ?? '');
  }
}

const state = (ok: boolean, bad: boolean) =>
  'bell__state ' + (ok ? 'bell__state--ok' : bad ? 'bell__state--bad' : 'bell__state--wait');
