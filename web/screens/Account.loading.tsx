import { FlowHeading, FlowRow } from '../components/Flow.tsx';
import { t } from '../i18n/index.ts';
import { Privacy } from './Account.privacy.tsx';
import { Profile } from './Account.profile.tsx';

export function AccountLoading() {
  const f = t().flows;
  return (
    <main class="screen flow" aria-busy="true">
      <FlowHeading eyebrow={f.corner} title={t().account.title} />
      <Profile who={null} />
      <div class="flow__band">
        <h2>{f.setup}</h2>
        <span class="label">{f.browser}</span>
      </div>
      <FlowRow to={{ name: 'alerts', step: 'channel' }} label={f.alertEmail} title="" loading />
      <FlowRow to={{ name: 'alerts' }} label={f.watchlist} title="" loading />
      <Privacy />
      <p class="flow__note" role="status">
        {t().common.loading}
      </p>
    </main>
  );
}
