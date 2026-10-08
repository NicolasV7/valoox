// The other two crops of a player card.
//
// Riot ships three and you meet the card in three places: the tall one on your
// profile, the wide one behind your name in the lobby, the square one beside
// it on the scoreboard. They are cropped differently, not scaled — the tall
// one has detail the small one never shows — so showing only the tall one is
// showing a third of the thing you are buying.
//
// Each is drawn where you actually meet it, with your own name on it, because
// "wide crop" means nothing and "behind your name in the lobby" is the same
// fact in a form you can check.

import { t } from '../i18n/index.ts';

export function Crops({
  wide,
  small,
  who,
}: {
  wide: string | null;
  small: string | null;
  who: string;
}) {
  const s = t().piece;
  const [handle, tag] = (who || '').split('#');

  return (
    <>
      <h2 class="label piece__head">{s.crops}</h2>

      <div class="crop crop--wide">
        {wide && <img src={wide} alt="" />}
        <div class="crop__who">
          <p class="crop__name">
            {handle}
            {tag && <span class="head__tag">#{tag}</span>}
          </p>
          <p class="crop__where">{s.wideWhere}</p>
        </div>
      </div>

      <div class="crop crop--small">
        {small && <img src={small} alt="" width="54" height="54" />}
        <div class="crop__who">
          <p class="crop__name">
            {handle}
            {tag && <span class="head__tag">#{tag}</span>}
          </p>
          <p class="crop__where">{s.smallWhere}</p>
        </div>
        <span class="faint num crop__size">{s.size}</span>
      </div>
    </>
  );
}
