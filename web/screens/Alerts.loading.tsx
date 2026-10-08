// Alerts, loading.
//
// Only one thing on this screen waits on anything: the renders. What you are
// watching and where it goes are ours — one row in our own database, back with
// the page — so the heading, the address and the count are drawn for real and
// the pictures are the holes.
//
// Which is why this is a short wait and a nearly complete screen, and why it
// does not have a spinner in the middle of it.

import { t } from '../i18n/index.ts';

const ROWS = [0, 1, 2];

export function AlertsLoading() {
  const s = t().alerts;

  return (
    <main class="screen bell">
      <header class="bell__head">
        <h1>{t().common.nav.alerts}</h1>
        <p class="small">{s.what}</p>
      </header>

      <div class="bell__box">
        <span class="label">{s.whereItGoes}</span>
        <span class="bell__to">
          <span class="skel bell__dot--waiting" />
          <span class="skel bell__at--waiting" />
        </span>
      </div>

      <h2 class="label bell__step">{s.watching}</h2>
      <div class="shelf">
        {ROWS.map((row) => (
          <div class="watch watch--waiting" key={row}>
            <span class="skel watch__art--waiting" />
            <span class="watch__id">
              <span class="skel watch__name--waiting" />
              <span class="skel watch__said--waiting" />
            </span>
            <span class="skel watch__star--waiting" />
          </div>
        ))}
      </div>

      <p class="legal bell__note">{s.waitingWhy}</p>
    </main>
  );
}
