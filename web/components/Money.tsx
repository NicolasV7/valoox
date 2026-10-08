// A price, with the coin it is paid in.
//
// Riot bills in three currencies and the app shows all three, because "1,200"
// means nothing without knowing which. The coin art is theirs, served from the
// same origin as every other render, so there is nothing to commit here.
//
// Always tabular. A column of prices that does not line up is a column you have
// to read twice.

import { locale } from '../i18n/index.ts';

const MEDIA = 'https://media.valorant-api.com/currencies/';

export type Coin = 'vp' | 'rad' | 'kc';

const UUID: Record<Coin, string> = {
  vp: '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741',
  rad: 'e59aa87c-4cbf-517a-5983-6e81511be9b7',
  kc: '85ca954a-41f2-ce94-9b45-8ca3dd39a00d',
};

export const coin = (of: Coin) => MEDIA + UUID[of] + '/displayicon.png';

export function Money({
  amount,
  of = 'vp',
  size = 14,
  struck = false,
  bare = false,
}: {
  amount: number | null;
  of?: Coin;
  size?: number;
  struck?: boolean;
  /** Without the coin. For a screen that has already said which one it is — a
   *  bundle prices every piece in VP and says so once, at the bottom, and the
   *  icon repeated eight times is both noise and, at a third of a phone wide,
   *  the thing that pushes the number off the edge. */
  bare?: boolean;
}) {
  // Riot omits a cost now and then. An em dash says we do not know it, which is
  // different from free.
  if (amount === null) return <span class="money num">—</span>;
  return (
    <span class={'money num money--' + of + (struck ? ' money--was' : '')}>
      {!bare && <img src={coin(of)} alt="" width={size} height={size} />}
      {amount.toLocaleString(locale())}
    </span>
  );
}
