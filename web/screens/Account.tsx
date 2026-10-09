// Account, not Settings: there is nothing here to configure.
//
// Who is signed in, the things worth saying out loud, and the way out. The
// order is the rule — the further down, the more permanent — and the only
// destructive thing is last and red.
//
// Every fact on it is one the app already had. The name and the equipped card
// ride in with the store, the address and the starred count come off the row
// this app owns, and the two that did not reach the browser before — the
// region and when the session last touched Riot — were already on the session
// and already a column nothing had selected.

import { useEffect, useState } from 'preact/hooks';
import { Mark } from '../components/Mark.tsx';
import { cardArt } from '../data/catalogue.ts';
import { usePrefs } from '../data/channel.ts';
import { MAX } from '../data/stars.ts';
import type { Account as Who } from '../data/types.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route } from '../route.ts';
import { Row } from './Account.row.tsx';

const CHANNEL: Route = { name: 'alerts', step: 'channel' };
const WATCHING: Route = { name: 'alerts' };
const KEEP: Route = { name: 'account', step: 'keep' };
const LEAVE: Route = { name: 'account', step: 'leave' };

/** How many rules the egress allowlist holds. Written down here and checked
 *  by a test, so the number on screen cannot drift from the list — the whole
 *  argument of that sentence is that it is countable. */
export const RULES = 19;

export function Account({ who }: { who: Who }) {
  const s = t().account;
  const prefs = usePrefs();
  const art = useCardArt(who.card);

  const at = who.name.lastIndexOf('#');
  const ok = prefs?.mail?.ok === true;
  const starred = prefs?.wishlist.length ?? 0;

  return (
    <main class="screen deck">
      <header class="deck__head">
        <h1>{s.title}</h1>
      </header>

      <div class="deck__who">
        {art ? (
          <img class="deck__face" src={art} alt="" />
        ) : (
          <span class="deck__face deck__face--none">
            <Mark size={22} />
          </span>
        )}
        <span class="deck__id">
          <span class="deck__name">
            {at > 0 ? who.name.slice(0, at) : who.name}
            {at > 0 && <span class="faint">{who.name.slice(at)}</span>}
          </span>
          <span class="deck__since num">{since(who)}</span>
        </span>
        <span class="bell__state bell__state--ok deck__live">
          <span class="bell__dot" />
          {s.live}
        </span>
      </div>
      <p class="legal deck__note">{s.liveWhy}</p>

      <h2 class="label deck__band">{s.alerts}</h2>
      <div class="deck__card">
        <Row
          to={CHANNEL}
          said={s.whereAlertsGo}
          under={prefs?.mail?.to || s.noAddress}
          end={prefs?.mail ? (ok ? s.verified : s.notVerified) : undefined}
        />
        <Row
          to={WATCHING}
          said={s.watching}
          under={s.starredCount(starred)}
          end={s.outOf(starred, MAX)}
          last
        />
      </div>

      <h2 class="label deck__band">{s.honest}</h2>
      <div class="deck__card">
        <Row to={KEEP} said={s.whatWeKeep} under={s.whatWeKeepUnder} />
        <Row said={s.whatItCalls} under={s.whatItCallsUnder(RULES)} />
        <Row said={s.notAffiliated} under={s.notAffiliatedUnder} last />
      </div>

      <h2 class="label deck__band">{s.build}</h2>
      <div class="deck__card">
        <Row said={s.madeBy} under={s.madeByUnder} />
        <Row said={s.source} under={s.sourceUnder} />
        <Row said={s.catalogue} under={s.catalogueUnder} last />
      </div>
      <p class="legal deck__note">{s.legal}</p>

      <h2 class="label deck__band">{s.leaving}</h2>
      <a class="deck__leave" href={href(LEAVE)} onClick={intercept(LEAVE)}>
        <span class="deck__id">
          <span class="deck__danger">{s.disconnect}</span>
          <span class="deck__under">{s.disconnectUnder}</span>
        </span>
      </a>
    </main>
  );

  /** "4 days ago", from the last time a request made the Worker reach Riot.
   *  Not "when you last opened the app": a cached read never touches Riot. */
  function since(acct: Who): string {
    const bits = [acct.shard?.toUpperCase(), acct.seen ? s.lastSeen(ago(acct.seen)) : null];
    return bits.filter(Boolean).join(' · ');
  }

  function ago(seconds: number): string {
    const hours = Math.floor((Date.now() / 1000 - seconds) / 3600);
    if (hours < 1) return s.justNow;
    if (hours < 24) return s.hoursAgo(hours);
    return s.daysAgo(Math.floor(hours / 24));
  }
}

/** The equipped player card, as the one picture that is yours. It is a uuid
 *  on the store view and a crop on somebody else's CDN, so it is resolved
 *  here rather than carried. */
function useCardArt(id: string | null | undefined): string | null {
  const [art, setArt] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return setArt(null);
    let alive = true;
    void cardArt(id).then((url) => {
      if (alive) setArt(url);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  return art;
}
