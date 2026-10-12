// One row of the alerts list: the thing, and whether it is starred.
//
// The same row on both screens that have one, because they are the same row —
// a thing you are watching and a thing you could watch differ by the fill of
// one star, and drawing them twice is how the two drift apart.
//
// The picture comes from the catalogue, one small request per item, cached for
// the life of the page. The weave behind it is measured off that picture, so a
// row is the colour of the thing on it.

import { CARDS, TITLES } from '../data/findable.ts';
import type { Star as Saved } from '../data/stars.ts';
import { usePiece } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept, type Route, type Whence } from '../route.ts';
import { Star } from './icons.tsx';

/** Guns get the letterbox, everything else gets the square. A render is 512
 *  across whatever it is of, so without this a spray arrives as wide as an
 *  Operator. */
const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';

/** Where a row goes when you tap it. A starred thing is a thing you were
 *  looking at a moment ago, so the row that names it should open it — both
 *  while searching and from the list it ends up on. */
const OPENS: Record<string, Route['name']> = {
  'e7c63390-eda7-46e0-bb7a-a6abdacd2433': 'skin',
  'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475': 'spray',
  'dd3bf334-87f3-40bd-b043-682a57a8dc3a': 'buddy',
  '3f296c07-64c3-494c-923b-fe692a4fa1bd': 'card',
  'de7caa6b-adf7-4588-bbd1-143831e786c6': 'title',
};

export type Thing = Saved;

export function Watch({
  item,
  on,
  shut,
  why,
  bare,
  note,
  from,
  toggle,
}: {
  item: Thing;
  on: boolean;
  /** Drop the picture column entirely.
   *
   *  A title has no artwork and never will — /v1/playertitles ships a string
   *  and nothing else. The fixed 96px first column exists so names do not step
   *  left and right as a MIXED list scrolls past, which is worth a hole beside
   *  the occasional title. In a list where nothing has a picture there is
   *  nothing to step against, and the column is 96px of indent with nothing in
   *  it. The list knows which it is; a row does not. */
  bare?: boolean;
  /** No room left, or nothing a store sells. The star still unstars; it just
   *  cannot add. */
  shut?: boolean;
  /** Why it cannot, where there is a reason worth saying. */
  why?: string;
  /** What it is and what it costs, when the screen knows. */
  note?: string;
  /** Where back goes from the screen this opens. */
  from?: Whence;
  toggle: (item: Thing) => void;
}) {
  const type = item.type ?? LEVELS;
  const piece = usePiece(type, item.id);
  const icon = piece?.tall ?? piece?.icon ?? null;
  const art = useArt(icon);
  const gun = type === LEVELS;
  const text = bare || type === TITLES;
  const common = t().common;
  const kind = gun
    ? common.kind.skin
    : type === CARDS
      ? common.kind.card
      : t().alerts.kinds[
          type === 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475'
            ? 'spray'
            : type === 'dd3bf334-87f3-40bd-b043-682a57a8dc3a'
              ? 'buddy'
              : 'title'
        ];
  const tier = item.tier?.toLowerCase();
  const word = tier && tier in common.tier ? common.tier[tier as keyof typeof common.tier] : kind;

  const name = OPENS[type];
  const to = name ? ({ name, id: item.id } as Route) : null;

  return (
    <div
      class={
        'watch stage ' +
        (text ? 'watch--bare' : gun ? 'watch--gun' : type === CARDS ? 'watch--card' : 'watch--bit')
      }
      style={artStyle(art)}
    >
      {to && (
        <a class="hit" href={href(to)} onClick={intercept(to, from)}>
          <span class="sr">{item.name}</span>
        </a>
      )}
      {!text &&
        (icon ? (
          <img class={gun ? 'watch__art' : 'watch__art watch__art--square'} src={icon} alt="" />
        ) : (
          <span class="watch__art" />
        ))}
      <span class="watch__id">
        <span class="watch__kind label">{word}</span>
        <span class="watch__name">{item.name}</span>
        {gun && !!item.levels && !!item.chromas && (
          <span class="watch__meta">{t().flows.skinDetails(item.levels, item.chromas)}</span>
        )}
        {note && <span class="watch__note num">{note}</span>}
      </span>
      <button
        type="button"
        class={on ? 'star star--inline star--on' : 'star star--inline'}
        disabled={!on && shut}
        aria-pressed={on}
        title={!on && why ? why : undefined}
        aria-label={
          !on && why ? why : on ? t().flows.removeFavourite(item.name) : t().alerts.watch(item.name)
        }
        onClick={() => toggle({ ...item, art: art ?? item.art })}
      >
        <Star size={19} on={on} />
      </button>
    </div>
  );
}
