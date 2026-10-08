// The page the footer of a message leads to.
//
// It asks before it does anything, and that is not politeness. A link in a
// mail is followed by scanners before a person sees it, so a page that acted
// on arrival would be a page that turned somebody's alerts off because their
// employer's filter opened the message first. A button cannot be pressed by
// a scanner.
//
// Nothing is thrown away either way. The list stays exactly as it was, with
// nowhere to send, and saying so is the only reassurance this screen owes:
// the thing people are afraid of when they unsubscribe is losing the work
// they put in.

import { useState } from 'preact/hooks';
import * as api from '../data/api.ts';
import { reload } from '../data/channel.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

type At =
  | { at: 'ask' }
  | { at: 'going' }
  | { at: 'done'; to: string | null; kept: number }
  | { at: 'kept' }
  | { at: 'failed' };

export function Stopped({ token }: { token: string }) {
  const s = t().stopped;
  const [state, set] = useState<At>({ at: 'ask' });

  if (state.at === 'done') {
    return (
      <Card art={SPRAY.asleep} said={s.stopped}>
        <p class="lede stop__lede">{state.to ? s.noMoreTo(state.to) : s.alreadyOff}</p>
        <p class="small stop__under">{state.kept > 0 ? s.keptCount(state.kept) : s.keptNone}</p>
      </Card>
    );
  }

  if (state.at === 'kept') {
    return (
      <Card art={SPRAY.carryOn} said={s.nothingChanged}>
        <p class="lede stop__lede">{s.stillOn}</p>
      </Card>
    );
  }

  if (state.at === 'failed') {
    return (
      <Card art={SPRAY.whoops} said={s.couldNot}>
        <p class="lede stop__lede">{s.couldNotWhy}</p>
      </Card>
    );
  }

  const busy = state.at === 'going';
  return (
    <Card art={SPRAY.holdOn} said={s.sure}>
      <p class="lede stop__lede">{s.sureWhy}</p>
      <div class="stop__pair">
        <button type="button" class="btn" disabled={busy} onClick={stop}>
          {busy ? t().common.loading : s.yesStop}
        </button>
        <button
          type="button"
          class="btn btn--quiet"
          disabled={busy}
          onClick={() => set({ at: 'kept' })}
        >
          {s.no}
        </button>
      </div>
    </Card>
  );

  async function stop() {
    set({ at: 'going' });
    const res = (await api
      .post<{ ok?: boolean; was?: string | null; kept?: number }>('/api/stop', { t: token })
      .catch(() => null)) as { ok?: boolean; was?: string | null; kept?: number } | null;

    if (!res?.ok) return set({ at: 'failed' });
    // The tab that was open on the alerts screen is now wrong about the
    // address. Cheap, and it is the same row.
    await reload();
    set({ at: 'done', to: res.was ?? null, kept: res.kept ?? 0 });
  }
}

/**
 * One shape for all four states, so the sticker and the heading do not move
 * between them — the screen reads as one place answering, not four pages.
 *
 * Keyed on the heading, which is what makes the answer arrive rather than
 * appear: a new key is a new subtree, so the entry animation plays again
 * instead of the old card silently becoming the new one. Nothing else on the
 * page moves, and prefers-reduced-motion flattens all of it.
 */
function Card({
  art,
  said,
  children,
}: {
  art: string;
  said: string;
  children: preact.ComponentChildren;
}) {
  return (
    <main class="screen stop">
      <div class="stop__mid rise" key={said}>
        <img class="stop__art" src={art} alt="" width="132" height="132" />
        <h1 class="stop__title">{said}</h1>
        {children}
      </div>
    </main>
  );
}
