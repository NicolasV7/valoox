// The page the footer of a message leads to.
//
// It asks before it does anything, and that is not politeness. A link in a
// mail is followed by scanners before a person sees it, so a page that acted
// on arrival would be a page that turned somebody's alerts off because their
// employer's filter opened the message first. A button cannot be pressed by
// a scanner.
//
// What it does on arrival is ask the Worker whether this link is still good,
// so nobody presses something that was never going to work.
//
// Nothing is thrown away either way. The list stays exactly as it was, with
// nowhere to send, and saying so is the only reassurance this screen owes:
// the thing people are afraid of when they unsubscribe is losing the work
// they put in.

import { useEffect, useState } from 'preact/hooks';
import * as api from '../data/api.ts';
import { reload } from '../data/channel.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

interface Said {
  ok?: boolean;
  live?: boolean;
  error?: string;
  was?: string | null;
  kept?: number;
}

type At =
  | { at: 'asking' }
  | { at: 'ask' }
  | { at: 'going' }
  | { at: 'done'; to: string | null; kept: number }
  | { at: 'kept' }
  | { at: 'used' }
  | { at: 'failed' };

/** One call for all three things this screen does: ask whether the link is
 *  still good, and answer it either way. Without an answer the Worker only
 *  reports, so arriving spends nothing. */
const say = (token: string, answer?: 'yes' | 'no') =>
  api.post<Said>('/api/stop', { t: token, answer }).catch(() => null) as Promise<Said | null>;

export function Stopped({ token }: { token: string }) {
  const s = t().stopped;
  const [state, set] = useState<At>({ at: 'asking' });

  useEffect(() => {
    let alive = true;
    void say(token).then((r) => {
      if (!alive) return;
      set(r?.error === 'used' ? { at: 'used' } : r?.ok ? { at: 'ask' } : { at: 'failed' });
    });
    return () => {
      alive = false;
    };
  }, [token]);

  if (state.at === 'done') {
    return (
      <Card art={SPRAY.letGo} said={s.stopped}>
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

  if (state.at === 'used') {
    return (
      <Card art={SPRAY.nothing} said={s.alreadyUsed}>
        <p class="lede stop__lede">{s.alreadyUsedWhy}</p>
      </Card>
    );
  }

  if (state.at === 'failed') {
    return (
      <Card art={SPRAY.lostConn} said={s.couldNot}>
        <p class="lede stop__lede">{s.couldNotWhy}</p>
      </Card>
    );
  }

  // Nothing is said until there is something true to say. The check is one
  // round trip to our own Worker, and asking "stop the alerts?" for the
  // length of it — on a link that turns out to be spent, or wrong — is the
  // screen making a claim before it knows one.
  if (state.at === 'asking') {
    return (
      <main class="screen stop">
        <div class="stop__mid">
          <span class="skel stop__art stop__art--waiting" />
          <span class="skel stop__title--waiting" />
        </div>
      </main>
    );
  }

  const busy = state.at === 'going';
  return (
    <Card art={SPRAY.huh} said={s.sure}>
      <p class="lede stop__lede">{s.sureWhy}</p>
      <div class="stop__pair">
        <button type="button" class="btn" disabled={busy} onClick={() => answer('yes')}>
          {busy ? t().common.loading : s.yesStop}
        </button>
        <button type="button" class="btn btn--quiet" disabled={busy} onClick={() => answer('no')}>
          {s.no}
        </button>
      </div>
    </Card>
  );

  async function answer(how: 'yes' | 'no') {
    set({ at: 'going' });
    const res = await say(token, how);
    if (res?.error === 'used') return set({ at: 'used' });
    if (!res?.ok) return set({ at: 'failed' });
    if (how === 'no') return set({ at: 'kept' });
    // The tab that was open on the alerts screen is now wrong about the
    // address. Cheap, and it is the same row.
    await reload();
    set({ at: 'done', to: res.was ?? null, kept: res.kept ?? 0 });
  }
}

/**
 * One shape for every state, so the sticker and the heading do not move
 * between them — the screen reads as one place answering, not six pages.
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
  children?: preact.ComponentChildren;
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
