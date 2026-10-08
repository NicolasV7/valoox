// The code, typed back.
//
// Six boxes rather than one field, because six digits read back off a phone
// are read in pairs and a single field gives you nowhere to lose your place.
// One real input underneath them carries the typing, so paste, autofill and
// the keyboard's own one-time-code suggestion all work — six separate inputs
// break all three.

import { useEffect, useRef, useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { useLeft } from '../components/Countdown.tsx';
import { again, landed, prove, refused, reload, usePrefs, useWatch } from '../data/channel.ts';
import { t } from '../i18n/index.ts';
import { ALERTS, go } from '../route.ts';

const BOXES = [0, 1, 2, 3, 4, 5];

export function AlertsCode() {
  const s = t().alerts;
  const prefs = usePrefs();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const [until, setUntil] = useState<number | null>(null);
  const wait = useLeft(until);
  const field = useRef<HTMLInputElement>(null);

  const to = prefs?.mail?.to ?? '';
  const sent = prefs?.mail?.said ?? '';
  const bad = refused(sent);
  // It is in the mailbox and the code in it is the one these boxes want, so
  // another send would only add a second code to the same thread. The control
  // goes away rather than greying out with a reason on it: there is nothing to
  // decide here, and Verify is the only thing left to do. The Worker refuses a
  // second send too — this is only the half that stops you asking for one.
  const here = landed(sent);

  // Six empty boxes and a message that already bounced is the one state this
  // screen could sit in for ever without saying so: the answer arrives at the
  // webhook, not here. So it asks, and leaves the moment there is an answer.
  useWatch(!bad);
  useEffect(() => {
    if (bad) go(ALERTS);
  }, [bad]);

  return (
    <main class="screen bell">
      <Back to={{ name: 'alerts', step: 'channel' }} said={s.whereItGoes} />

      {/* The channel took it, which is the only thing this line claims — and
          the only thing anybody could do with the provider's own word for it
          is misread it as delivery. The colour is still read off the status
          rather than assumed, so it cannot go stale. */}
      <p class={refused(sent) ? 'bell__sent bell__sent--bad' : 'bell__sent'}>
        <span class="bell__dot" />
        {s.sentOut}
      </p>
      <h1 class="bell__ask">{s.typeTheCode}</h1>
      <p class="lede bell__to">{s.sixDigitsTo(to)}</p>

      {/* The boxes are the picture; the input under them is the field. */}
      <button type="button" class="pin" onClick={() => field.current?.focus()}>
        {BOXES.map((i) => (
          <span class={i === code.length ? 'pin__box pin__box--on' : 'pin__box'} key={i}>
            {code[i] ?? ''}
          </span>
        ))}
      </button>
      <input
        ref={field}
        class="pin__field"
        type="text"
        inputMode="numeric"
        autocomplete="one-time-code"
        maxLength={6}
        value={code}
        aria-label={s.typeTheCode}
        onInput={(e) => {
          const next = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
          setCode(next);
          setSaid(null);
        }}
      />

      <div class="bell__pair">
        <button type="button" class="btn" disabled={code.length !== 6 || busy} onClick={check}>
          {s.verify}
        </button>
        {!here && (
          <button type="button" class="btn btn--quiet" disabled={busy || wait > 0} onClick={more}>
            {s.sendItAgain}
          </button>
        )}
      </div>

      {(wait > 0 || said) && (
        <p class="bell__why bell__why--bad bell__why--mid">
          {wait > 0 ? s.waitSeconds(wait) : said}
        </p>
      )}

      <p class="legal bell__note">{s.tenAndFive}</p>

      <h2 class="label bell__step">{s.whatHappensAfter}</h2>
      <p class="legal bell__under">{s.afterWhy}</p>
    </main>
  );

  async function check() {
    setBusy(true);
    const res = (await prove(code)) as { ok?: boolean; error?: string; left?: number | null };
    setBusy(false);
    if (res?.ok) {
      await reload();
      return go(ALERTS);
    }
    setCode('');
    const how = res?.error;
    setSaid(
      how === 'gone'
        ? s.codeGone
        : how === 'spent'
          ? s.codeSpent
          : how === 'taken'
            ? s.taken
            : s.codeWrong(res?.left ?? 0),
    );
  }

  async function more() {
    setBusy(true);
    const res = (await again()) as { error?: string; wait?: number; sent?: boolean };
    setBusy(false);
    setCode('');
    // A moment, not a count: see useLeft. The line counts itself down and
    // goes away on its own when the cooldown is up.
    if (res?.error === 'wait') return setUntil(Date.now() + (res.wait ?? 0) * 1000);
    await reload();
    if (res?.error === 'bounced' || !res?.sent) go(ALERTS);
  }
}
