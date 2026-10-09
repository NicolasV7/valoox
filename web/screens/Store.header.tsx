// Who you are, what you can spend, and how long the store has left.
//
// Not store data, strictly — but it shares the payload and the same cache
// lifetime, and it is the first thing read on a screen that is open for ten
// seconds. The equipped player card sits behind it at low opacity: it is the
// one piece of personalisation Riot gives that costs nothing to show.

import { useEffect, useState } from 'preact/hooks';
import { Countdown } from '../components/Countdown.tsx';
import { Money } from '../components/Money.tsx';
import { cardArt, rankIcon } from '../data/catalogue.ts';
import type { Account, Wallet } from '../data/types.ts';
import { t } from '../i18n/index.ts';

/** Riot's competitive tiers, by index. 0 is unranked and 1–2 never existed. */
const TIERS = [
  'Unranked',
  '',
  '',
  'Iron 1',
  'Iron 2',
  'Iron 3',
  'Bronze 1',
  'Bronze 2',
  'Bronze 3',
  'Silver 1',
  'Silver 2',
  'Silver 3',
  'Gold 1',
  'Gold 2',
  'Gold 3',
  'Platinum 1',
  'Platinum 2',
  'Platinum 3',
  'Diamond 1',
  'Diamond 2',
  'Diamond 3',
  'Ascendant 1',
  'Ascendant 2',
  'Ascendant 3',
  'Immortal 1',
  'Immortal 2',
  'Immortal 3',
  'Radiant',
];

export function StoreHeader({
  account,
  wallet,
  remaining,
  since,
}: {
  account: Account;
  wallet: Wallet;
  remaining: number;
  /** When `remaining` was true — see components/Countdown.tsx. */
  since?: number;
}) {
  const [art, setArt] = useState<string | null>(null);
  const [badge, setBadge] = useState<string | null>(null);
  const [name, tag] = (account.name || '').split('#');
  const rank = account.rank;
  const named = rank && TIERS[rank.tier];

  useEffect(() => {
    if (!account.card) return;
    let live = true;
    void cardArt(account.card).then((url) => {
      if (live) setArt(url);
    });
    return () => {
      live = false;
    };
  }, [account.card]);

  useEffect(() => {
    if (!rank) return;
    let live = true;
    void rankIcon(rank.tier).then((url) => {
      if (live) setBadge(url);
    });
    return () => {
      live = false;
    };
  }, [rank]);

  return (
    <header class="head">
      {/* The identity band. Riot's own two pieces of personalisation — the
          equipped card behind, the rank badge beside — and nothing we chose. */}
      <div class="head__who">
        {art && <img class="head__card" src={art} alt="" />}
        {badge && <img class="head__badge" src={badge} alt="" width="44" height="44" />}

        <div class="head__id">
          <span class="item">
            {name}
            {tag && <span class="head__tag">#{tag}</span>}
          </span>
          <span class="label head__rank">
            {named ? t().store.rank(named, rank.rr) : t().store.unranked}
          </span>
        </div>
      </div>

      <div class="head__line">
        <Money amount={wallet.vp} of="vp" size={16} />
        <Money amount={wallet.rad} of="rad" size={16} />
        <Money amount={wallet.kc} of="kc" size={16} />
        <Countdown from={remaining} since={since} className="head__clock" />
      </div>
    </header>
  );
}
