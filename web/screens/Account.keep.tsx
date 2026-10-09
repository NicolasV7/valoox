// What we keep, and what we do not.
//
// The first sentence is the one that matters: the session this app holds
// reads your account without a password and without a second factor. That is
// what scanning hands over, and saying it first is what earns the rest of the
// page the right to be read.
//
// Every line here names something that exists in the code. The sealed row is
// one row; the things that are not in it — a cached store, a code's hash, a
// message id — expire on their own and are named rather than left out, because
// a page that enumerates storage and mentions only the part it is proud of is
// not describing what the Worker does.

import { Back } from '../components/Back.tsx';
import { SPRAY } from '../design/sprays.ts';
import { t } from '../i18n/index.ts';
import type { Route } from '../route.ts';

const ACCOUNT: Route = { name: 'account' };

export function AccountKeep() {
  const s = t().account;

  return (
    <main class="screen deck">
      <Back to={ACCOUNT} said={s.title} />

      <div class="bell__crown deck__crown">
        <h1 class="deck__title">{s.keepTitle}</h1>
        {/* Cypher at a laptop with a hand over Killjoy's eyes: what is kept,
            and who can read it. */}
        <img src={SPRAY.secrets} alt="" width="84" height="84" />
      </div>
      <p class="lede deck__lede">{s.keepLede}</p>

      <h2 class="label deck__band">{s.kept}</h2>
      <div class="deck__list">
        <Fact said={s.keepJar} why={s.keepJarWhy} />
        <Fact said={s.keepWho} why={s.keepWhoWhy} />
        <Fact said={s.keepList} why={s.keepListWhy} />
        <Fact said={s.keepMail} why={s.keepMailWhy} />
      </div>

      <h2 class="label deck__band">{s.notKept}</h2>
      <div class="deck__list deck__list--not">
        <Fact said={s.noPassword} why={s.noPasswordWhy} />
        <Fact said={s.noLog} why={s.noLogWhy} />
        <Fact said={s.noReach} why={s.noReachWhy} />
      </div>

      <p class="legal deck__note">{s.twoLocks}</p>
      <p class="legal deck__note">{s.alsoKv}</p>
    </main>
  );
}

function Fact({ said, why }: { said: string; why: string }) {
  return (
    <div class="deck__fact">
      <span class="deck__said">{said}</span>
      <span class="deck__why">{why}</span>
    </div>
  );
}
