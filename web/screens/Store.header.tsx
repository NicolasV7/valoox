// Who you are, what you can spend, and how long the store has left.
//
// Not store data, strictly — but it shares the payload and the same cache
// lifetime, and it is the first thing read on a screen that is open for ten
// seconds. The equipped player card sits behind it at low opacity: it is the
// one piece of personalisation Riot gives that costs nothing to show.

import { useEffect, useState } from 'preact/hooks';
import { Countdown } from '../components/Countdown.tsx';
import { Money } from '../components/Money.tsx';
import { cardArt } from '../data/catalogue.ts';
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
}: {
  account: Account;
  wallet: Wallet;
  remaining: number;
}) {
  const [art, setArt] = useState<string | null>(null);
  const [name, tag] = (account.name || '').split('#');

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

  const rank = account.rank;
  const named = rank && TIERS[rank.tier];

  return (
    <header class="head">
      {art && <img class="head__card" src={art} alt="" />}

      <div class="head__who">
        <span class="item">
          {name}
          {tag && <span class="head__tag">#{tag}</span>}
        </span>
        <span class="label head__rank">
          {named ? t().store.rank(named, rank.rr) : t().store.unranked}
        </span>
      </div>

      <div class="head__line">
        <Money amount={wallet.vp} of="vp" />
        <Money amount={wallet.rad} of="rad" />
        <Money amount={wallet.kc} of="kc" />
        <Countdown from={remaining} className="head__clock" />
      </div>
    </header>
  );
}
