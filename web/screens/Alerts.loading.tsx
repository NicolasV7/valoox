import { Back } from '../components/Back.tsx';
import { FlowBrand, FlowHeading, FlowRetry } from '../components/Flow.tsx';
import { reload, usePrefsError } from '../data/channel.ts';
import { t } from '../i18n/index.ts';
import { ALERTS } from '../route.ts';

/** Static copy stays readable while the saved settings or catalogue load. */
export function AlertsLoading({ step = 'list' }: { step?: 'list' | 'channel' | 'code' | 'add' }) {
  const s = t().alerts;
  const f = t().flows;
  const failed = usePrefsError();
  const heading =
    step === 'channel'
      ? { eyebrow: f.destination, title: s.whereItGoes, lead: f.inboxLead }
      : step === 'code'
        ? { eyebrow: f.finalStep, title: f.proofTitle }
        : step === 'add'
          ? { eyebrow: f.onRadar, title: s.addSomethingTitle, lead: f.searchLead }
          : { eyebrow: f.radar, title: t().common.nav.alerts, lead: f.alertsLead };
  return (
    <main class="screen flow" aria-busy={!failed}>
      <FlowBrand />
      {step !== 'list' && <Back to={ALERTS} said={t().common.nav.alerts} />}
      <FlowHeading {...heading} />
      {step === 'list' ? (
        <>
          <div class="flow__pending flow__pending--hero" aria-hidden="true" />
          <div class="flow__row">
            <span class="flow__row-copy">
              <span class="label">{s.whereItGoes}</span>
              <span class="flow__pending flow__pending--line" />
            </span>
          </div>
          <div class="flow__band">
            <h2>{s.weapons}</h2>
          </div>
          <div class="flow__pending flow__pending--row" aria-hidden="true" />
          <div class="flow__band">
            <h2>{s.accessories}</h2>
          </div>
          <div class="flow__pending flow__pending--row" aria-hidden="true" />
        </>
      ) : (
        <div class="flow__pending flow__pending--surface" aria-hidden="true" />
      )}
      {step === 'add' && (
        <button type="button" class="btn btn--quiet" disabled>
          {t().common.waitingCatalogue}
        </button>
      )}
      <FlowRetry
        failed={failed}
        retry={() => {
          void reload();
        }}
      />
    </main>
  );
}
