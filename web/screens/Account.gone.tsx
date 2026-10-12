import { FlowArt, FlowBrand, FlowHeading, FlowInfo } from '../components/Flow.tsx';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';

/** Expiry and a confirmed disconnect share art, but make different claims. */
export function AccountGone({
  onScan,
  onWait,
  removed = false,
}: {
  onScan: () => void;
  onWait: () => void;
  removed?: boolean;
}) {
  const s = t().account;
  const f = t().flows;
  return (
    <main class="screen flow">
      <FlowBrand />
      <FlowHeading
        eyebrow={removed ? f.freshStart : s.itEnded}
        title={removed ? f.removedAccess : f.endedTitle}
        lead={removed ? f.endedLead : t().common.error.expiredWhy}
      />
      <FlowArt art={FLOW.ended} />
      <FlowInfo title={f.mobileSignIn}>{f.passwordThere}</FlowInfo>
      <button type="button" class="btn" onClick={onScan}>
        {s.scanAgain}
      </button>
      <button type="button" class="btn btn--quiet" onClick={onWait}>
        {s.notNow}
      </button>
      <p class="flow__note">{removed ? f.separateWhy : s.jobSkips}</p>
      <p class="flow__note">{t().common.riotNotice}</p>
    </main>
  );
}
