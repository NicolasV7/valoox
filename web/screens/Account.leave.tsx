// The way out. The screen is the confirmation; a dialog on top of it would
// only train people to click through two.
//
// The board this was drawn from promised that a starred list survives a
// disconnect, keyed to your Riot account id, and that a new scan would find
// it waiting. It cannot: the list is a field inside the sealed blob, the blob
// is the row, and disconnecting deletes the row — and there is no table keyed
// to a Riot id, deliberately, because that is the one thing schema.sql is
// written not to hold. The panel says what genuinely does survive instead,
// which is Riot's own session, and which is the sentence a person actually
// needs before pressing this.

import { useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { Check } from '../components/icons.tsx';
import * as api from '../data/api.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';
import { go, type Route } from '../route.ts';

const ACCOUNT: Route = { name: 'account' };

export function AccountLeave({ onGone }: { onGone: () => void }) {
  const s = t().account;
  const [busy, setBusy] = useState(false);

  return (
    <main class="screen deck">
      <Back to={ACCOUNT} said={s.title} />

      <div class="bell__crown deck__crown">
        <h1 class="deck__title">{s.leaveTitle}</h1>
        {/* Being teleported out, waving. */}
        <img src={SPRAY.seeYou} alt="" width="84" height="84" />
      </div>
      <p class="lede deck__lede">{s.leaveLede}</p>

      <h2 class="label deck__band">{s.goes}</h2>
      <div class="deck__list">
        <Gone said={s.goesJar} />
        <Gone said={s.goesMail} />
        <Gone said={s.goesList} />
      </div>
      <p class="legal deck__note">{s.listGoesWhy}</p>

      <h2 class="label deck__band">{s.staysTitle}</h2>
      <div class="deck__stays">
        <span class="deck__tick">
          <Check size={13} />
        </span>
        <span class="deck__why">{s.staysRiot}</span>
      </div>
      <p class="legal deck__note">{s.staysWhy}</p>

      <div class="deck__pair">
        <button type="button" class="btn btn--quiet" disabled={busy} onClick={() => go(ACCOUNT)}>
          {s.cancel}
        </button>
        <button type="button" class="btn btn--gone" disabled={busy} onClick={leave}>
          {busy ? t().common.loading : s.disconnect}
        </button>
      </div>
      <p class="legal deck__note">{s.noDialog}</p>
    </main>
  );

  async function leave() {
    setBusy(true);
    await api.logout().catch(() => null);
    // Everything on screen is about a row that no longer exists, so the app
    // goes back to the one question it starts from rather than redrawing a
    // tab over a session that is gone.
    onGone();
  }
}

function Gone({ said }: { said: string }) {
  return (
    <div class="deck__fact deck__fact--gone">
      <span class="deck__cross">✕</span>
      <span class="deck__why">{said}</span>
    </div>
  );
}
