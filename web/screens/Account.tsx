import { FlowBrand, FlowHeading, FlowRetry, FlowRow, FlowState } from '../components/Flow.tsx';
import { Chevron } from '../components/icons.tsx';
import { refused, reload, usePrefs, usePrefsError } from '../data/channel.ts';
import { LEVELS } from '../data/findable.ts';
import type { Account as Who } from '../data/types.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route } from '../route.ts';
import { AccountBuild } from './Account.build.tsx';
import { Coffee } from './Account.coffee.tsx';
import { Privacy } from './Account.privacy.tsx';
import { Profile } from './Account.profile.tsx';

const CHANNEL: Route = { name: 'alerts', step: 'channel' };
const WATCHING: Route = { name: 'alerts' };
const LEAVE: Route = { name: 'account', step: 'leave' };
const COFFEE = 'https://buymeacoffee.com/termoo';

// Checked against the actual allowlist by test/unit/upstream.test.ts.
export const RULES = 18;

export function Account({ who }: { who: Who }) {
  const s = t().account;
  const f = t().flows;
  const prefs = usePrefs();
  const failed = usePrefsError();
  const from = { to: { name: 'account' } as const, said: s.title };
  const bad = refused(prefs?.mail?.said);
  const ok = prefs?.mail?.ok === true && !bad;
  const all = prefs?.wishlist ?? [];
  const guns = all.filter((w) => (w.type ?? LEVELS) === LEVELS).length;
  return (
    <main class="screen flow">
      <FlowBrand />
      <FlowHeading eyebrow={f.corner} title={s.title} />
      <Profile key={who.card ?? ''} who={who} />
      <div class="flow__band">
        <h2>{f.setup}</h2>
        <span class="label">{f.browser}</span>
      </div>
      <FlowRow
        to={CHANNEL}
        from={from}
        label={f.alertEmail}
        title={prefs?.mail?.to || s.noAddress}
        loading={!prefs}
        state={
          prefs?.mail && (
            <FlowState kind={bad ? 'bad' : ok ? 'ok' : 'wait'}>
              {bad ? t().alerts.wasRefused : ok ? s.verified : s.notVerified}
            </FlowState>
          )
        }
      />
      <FlowRow
        to={WATCHING}
        from={from}
        label={f.watchlist}
        title={f.favourites(all.length)}
        loading={!prefs}
        detail={prefs ? f.listSplit(guns, all.length - guns) : undefined}
      />
      {!prefs && (
        <FlowRetry
          failed={failed}
          retry={() => {
            void reload();
          }}
        />
      )}
      <Privacy />
      <div class="flow__band">
        <h2>{f.checkable}</h2>
      </div>
      <div class="flow__proof">
        <span>{f.noPassword}</span>
        <span>{f.readOnly}</span>
      </div>
      <Coffee to={COFFEE} />
      <AccountBuild rules={RULES} />
      <a class="flow__leave" href={href(LEAVE)} onClick={intercept(LEAVE)}>
        <span>
          {f.disconnect}
          <span class="small">{f.disconnectHint}</span>
        </span>
        <Chevron />
      </a>
      <p class="flow__note">{t().common.riotNotice}</p>
    </main>
  );
}
