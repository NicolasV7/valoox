import { Back } from '../components/Back.tsx';
import { FlowArt, FlowBrand, FlowHeading } from '../components/Flow.tsx';
import { usePrefs } from '../data/channel.ts';
import { FLOW } from '../design/flows.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';

const ACCOUNT = { name: 'account' } as const;

export function AccountKeep() {
  const s = t().account;
  const f = t().flows;
  const prefs = usePrefs();
  return (
    <main class="screen flow">
      <FlowBrand />
      <Back to={ACCOUNT} said={s.title} />
      <FlowHeading eyebrow={f.details} title={s.keepTitle} lead={f.keepLead} />
      <FlowArt art={FLOW.custody} className="flow__mail">
        <div>
          <span class="label">{f.sealedFirst}</span>
          <h2>{f.serverSide}</h2>
        </div>
      </FlowArt>
      <div class="flow__band">
        <h2>{f.stored}</h2>
      </div>
      <Fact title={f.session} state={f.sealedFirst} open>
        {s.keepJarWhy} {s.keepWhoWhy}
      </Fact>
      <Fact title={f.watchlist} state={prefs ? f.favourites(prefs.wishlist.length) : undefined}>
        {s.keepListWhy}
      </Fact>
      <Fact
        title={f.emailAlerts}
        state={prefs?.mail ? (prefs.mail.ok ? s.verified : s.notVerified) : undefined}
      >
        {s.keepMailWhy}
      </Fact>
      <Fact title={f.cached} state={f.sealedFirst}>
        {f.cachedWhy}
      </Fact>
      <div class="flow__band">
        <h2>{f.excluded}</h2>
      </div>
      <ul class="flow__excluded">
        <li>{f.noPassword}</li>
        <li>{f.purchaseHistory}</li>
        <li>{f.noRequests}</li>
      </ul>
      <p class="flow__note">{s.keepLede}</p>
      <p class="flow__note">{s.alsoKv}</p>
      <p class="flow__note">{f.retention}</p>
      <a class="btn btn--quiet" href={href(ACCOUNT)} onClick={intercept(ACCOUNT)}>
        {s.title}
      </a>
    </main>
  );
}

function Fact({
  title,
  state,
  children,
  open = false,
}: {
  title: string;
  state?: string;
  children: preact.ComponentChildren;
  open?: boolean;
}) {
  return (
    <details class="flow__detail" open={open}>
      <summary>
        {title}
        {state && <span>{state}</span>}
      </summary>
      <p>{children}</p>
    </details>
  );
}
