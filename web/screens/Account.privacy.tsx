import { FlowArt } from '../components/Flow.tsx';
import { Chevron } from '../components/icons.tsx';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

const KEEP = { name: 'account', step: 'keep' } as const;

/** This static explanation is identical before and after preferences arrive. */
export function Privacy() {
  const f = t().flows;
  return (
    <FlowArt art={FLOW.privacy} className="flow__trust">
      <div>
        <span class="label">{f.worthKnowing}</span>
        <h2>{f.encrypted}</h2>
        <p>{f.privacyLead}</p>
        <a href={href(KEEP)} onClick={intercept(KEEP)}>
          {t().account.whatWeKeep}
          <Chevron />
        </a>
      </div>
    </FlowArt>
  );
}
