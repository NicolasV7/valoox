import { Countdown } from '../components/Countdown.tsx';
import { FlowArt, FlowBrand, FlowHeading, FlowRow, FlowState } from '../components/Flow.tsx';
import { Watch } from '../components/Watch.tsx';
import { waiting } from '../data/channel.ts';
import { LEVELS, TITLES } from '../data/findable.ts';
import { BITS, GUNS, useStars } from '../data/stars.ts';
import type { Prefs, StoreView } from '../data/types.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route, type Whence } from '../route.ts';
import { AlertsStandby } from './Alerts.standby.tsx';

const CHANNEL: Route = { name: 'alerts', step: 'channel' };
const CODE: Route = { name: 'alerts', step: 'code' };
const ADD: Route = { name: 'alerts', step: 'add' };

export function AlertsWorking({ prefs, view }: { prefs: Prefs; view: StoreView }) {
  const s = t().alerts;
  const f = t().flows;
  const mail = prefs.mail;
  const { stars, on, shut, toggle } = useStars();
  const all = stars ?? [];
  const guns = all.filter((w) => (w.type ?? LEVELS) === LEVELS);
  const bits = all.filter((w) => (w.type ?? LEVELS) !== LEVELS);
  const wordy = bits.length > 0 && bits.every((w) => w.type === TITLES);
  const ok = mail?.ok === true;
  const to = waiting(prefs) && !ok ? CODE : CHANNEL;
  const from: Whence = { to: { name: 'alerts' }, said: t().common.nav.alerts };
  return (
    <main class="screen flow">
      <FlowBrand />
      <FlowHeading eyebrow={f.radar} title={t().common.nav.alerts} lead={f.alertsLead} />
      <FlowArt art={FLOW.watching} className="flow__hero">
        <div>
          <span class="label">{f.onRadar}</span>
          <strong class="flow__number">
            {all.length} <span>{f.worthWaiting(all.length)}</span>
          </strong>
          <span class="small">{f.listPromise}</span>
        </div>
      </FlowArt>
      <FlowRow
        to={to}
        label={s.whereItGoes}
        title={mail?.to || s.yourEmail}
        state={
          <FlowState kind={ok ? 'ok' : 'wait'}>
            {ok ? s.verified : waiting(prefs) ? s.oneIsOut : s.notVerified}
          </FlowState>
        }
      />
      {!ok && <AlertsStandby starred={all.length} />}
      <Group
        title={s.weapons}
        left={view.remaining}
        since={view.fetchedAt}
        count={guns.length}
        max={GUNS}
      />
      {guns.length ? (
        <div class="flow__list">
          {guns.map((w) => (
            <Watch
              key={w.id}
              item={w}
              on={on(w.id)}
              shut={shut(w.type)}
              from={from}
              toggle={toggle}
            />
          ))}
        </div>
      ) : (
        <p class="flow__note">{s.noGuns}</p>
      )}
      <Group
        title={s.accessories}
        left={view.accessory?.remaining ?? null}
        since={view.fetchedAt}
        count={bits.length}
        max={BITS}
      />
      {bits.length ? (
        <div class="flow__list">
          {bits.map((w) => (
            <Watch
              key={w.id}
              item={w}
              on={on(w.id)}
              bare={wordy}
              shut={shut(w.type)}
              from={from}
              toggle={toggle}
            />
          ))}
        </div>
      ) : (
        <p class="flow__note">{s.noBits}</p>
      )}
      <a class="btn" href={href(ADD)} onClick={intercept(ADD)}>
        {f.add}
      </a>
      <p class="flow__note">{f.noMatch}</p>
      <p class="flow__note">{s.hundredWhy}</p>
    </main>
  );
}

function Group({
  title,
  left,
  since,
  count,
  max,
}: {
  title: string;
  left: number | null;
  since: number;
  count: number;
  max: number;
}) {
  return (
    <div class="flow__band">
      <div>
        <h2>{title}</h2>
        <span class="flow__count num">{t().alerts.outOf(count, max)}</span>
      </div>
      {left !== null && (
        <span class="flow__clock">
          <Countdown from={left} since={since} />
          <span class="flow__clock-label">{t().alerts.rotatesIn}</span>
        </span>
      )}
    </div>
  );
}
