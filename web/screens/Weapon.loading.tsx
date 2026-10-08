// A slot, before the catalogue answers.
//
// The hero is the final 152px and the rows are the final 86, so nothing slides
// when the names land. The search is drawn and plainly dead: the thing it
// filters has not arrived, and a field that silently does nothing is worse
// than one that says it is waiting.
//
// Two things the board draws real are holes here, and for the same reason: the
// weapon's name and how many of its skins are yours both come out of the index
// that is still in flight. Riot answers with ids, and an id does not say which
// gun it belongs to.

import { Back, COLLECTION } from '../components/Back.tsx';
import { Search } from '../components/icons.tsx';
import { t } from '../i18n/index.ts';

const ROWS = [0, 1, 2, 3, 4];

export function WeaponLoading() {
  const waiting = t().common.waitingCatalogue;

  return (
    <main class="screen gun">
      <Back to={COLLECTION} />

      <div class="gun__id">
        <h1>
          <span class="skel gun__name--waiting" />
        </h1>
        <span class="skel gun__count--waiting" />
      </div>

      <div class="worn--waiting" />

      <div class="find find--waiting">
        <span class="find__glass">
          <Search />
        </span>
        <input type="search" disabled placeholder={waiting} aria-label={waiting} />
      </div>

      <div class="gun__head">
        <h2 class="label">{t().weapon.alsoYours}</h2>
      </div>
      <Shelf />

      <div class="gun__head">
        <h2 class="label">{t().weapon.notYours}</h2>
      </div>
      <Shelf />

      <p class="legal gun__note">{t().weapon.waitingWhy}</p>
    </main>
  );
}

function Shelf() {
  return (
    <div class="shelf">
      {ROWS.map((row) => (
        <div class="skin skin--waiting" key={row}>
          <span class="skel skin__art--waiting" />
          <span class="skin__id">
            <span class="skel skin__text--waiting" />
            <span class="skel skin__what--waiting" />
          </span>
          <span class="skel skin__end--waiting" />
        </div>
      ))}
    </div>
  );
}
