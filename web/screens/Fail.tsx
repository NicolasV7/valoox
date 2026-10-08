// When it did not work.
//
// Three outcomes and no more, because three is all a person can act on: your
// session ended at Riot, Riot did not answer, or we broke. Each one gets a
// different sentence and a different button, which is the whole reason they are
// told apart at all.
//
// The server's own message never appears here. It is written for a log —
// `storefront 403`, `sealed blob did not open` — and a stack trace in front of
// somebody checking a shop is not an explanation. The status code does show,
// because it is the one piece a person can quote when asking what happened.

import type { Fault } from '../data/types.ts';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';

export function Fail({
  fault,
  status,
  onRetry,
}: {
  fault: Fault;
  status: number;
  onRetry: () => void;
}) {
  const e = t().common.error;
  const said = {
    expired: [e.expired, e.expiredWhy, e.scanAgain],
    riot: [e.riot, e.riotWhy, t().common.retry],
    us: [e.us, e.usWhy, t().common.retry],
  }[fault];

  return (
    <div class="screen fail">
      <div class="fail__head">
        <h1>{said[0]}</h1>
        <img src={SPRAY.whoops} alt="" width="84" height="84" />
      </div>

      <p class="lede fail__why">{said[1]}</p>

      <button type="button" class="btn fail__do" onClick={onRetry}>
        {said[2]}
      </button>

      {status > 0 && <p class="legal fail__code num">{e.status(status)}</p>}
    </div>
  );
}
