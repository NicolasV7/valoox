// Stopped, from the footer of a message.
//
// It acts on arrival rather than behind a button, and that is deliberate in
// both directions. A link in a mail is followed by scanners before a person
// sees it, so the Worker refuses a GET and this posts instead — a scanner
// does not run the page. And once a person has pressed Stop, asking them to
// press it again is a dark pattern with a confirmation dialog on it.
//
// What it does not do is throw anything away. The list stays exactly as it
// was, with nowhere to send, which is the only part of this worth a whole
// screen: the thing people are actually afraid of when they unsubscribe is
// losing the work they put in.

import { useEffect, useState } from 'preact/hooks';
import * as api from '../data/api.ts';
import { reload } from '../data/channel.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';
import { ALERTS, href, intercept } from '../route.ts';

type Done = { was: string | null; kept: number };

export function Stopped({ token }: { token: string }) {
  const s = t().stopped;
  const [done, setDone] = useState<Done | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void api
      .post<{ ok?: boolean; was?: string | null; kept?: number }>('/api/stop', { t: token })
      .then(async (r) => {
        if (!alive) return;
        const got = r as { ok?: boolean; was?: string | null; kept?: number };
        if (!got?.ok) return setFailed(true);
        setDone({ was: got.was ?? null, kept: got.kept ?? 0 });
        // The tab that was open on the alerts screen is now wrong about the
        // address. Cheap, and it is the same row.
        await reload();
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <main class="screen stop">
      <img class="stop__art" src={SPRAY.asleep} alt="" width="120" height="120" />
      <h1 class="stop__title">{failed ? s.couldNot : done ? s.stopped : s.stopping}</h1>

      {failed && <p class="lede stop__lede">{s.couldNotWhy}</p>}

      {done && (
        <>
          <p class="lede stop__lede">{done.was ? s.noMoreTo(done.was) : s.alreadyOff}</p>
          <div class="stop__kept">
            <span class="label">{s.standby}</span>
            <p class="small">{done.kept > 0 ? s.keptCount(done.kept) : s.keptNone}</p>
          </div>
          <a class="btn stop__back" href={href(ALERTS)} onClick={intercept(ALERTS)}>
            {s.putOneBack}
          </a>
          <p class="legal stop__note">{s.whatWeDid}</p>
          <p class="legal stop__note">{s.riotIsSeparate}</p>
        </>
      )}
    </main>
  );
}
