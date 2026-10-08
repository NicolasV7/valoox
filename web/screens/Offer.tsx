// One offer, opened.
//
// The question here is never "what is it called" — the row you tapped already
// said that. It is "what does it do, and what does it look like in the other
// colours", which is the one thing the storefront cannot answer and Riot's own
// clip can.
//
// Everything on this screen after the price comes out of the weapons index: a
// skin level carries no reference to its parent, so the levels beside this one
// and the chromas are only reachable there. It is 426 KB over the wire and the
// screen has a skeleton while it lands — which is exactly the trade the store
// refuses to make and this screen is the point of. See data/skins.ts.

import { useRef, useState } from 'preact/hooks';
import { Chevron, Play } from '../components/icons.tsx';
import { Money } from '../components/Money.tsx';
import { tierByPrice } from '../data/tiers.ts';
import type { StoreView } from '../data/types.ts';
import { useFamily, useSkin } from '../data/usePiece.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { back } from '../route.ts';
import { chipFor, chosen, Levels, Variants } from './Offer.levels.tsx';

/** Seconds into the clip to sit on while it is still. Far enough past the
 *  longest fade-in measured, near enough that it is still the opening shot. */
const STILL = 1.2;

import { OfferLoading } from './Offer.loading.tsx';

export function Offer({ id, view }: { id: string; view: StoreView }) {
  const s = t().offer;
  const found = useSkin(id);
  const family = useFamily(id);
  const art = useArt(found?.icon);

  // Which level's clip is playing, and which chroma is on the stage. Both
  // start where you came in and are only ever changed by a tap.
  const [level, setLevel] = useState(id);
  const [chroma, setChroma] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  // Whether the clip has a frame yet. Until it does the element paints black,
  // which is a hole in the screen for however long the first bytes take.
  const [lit, setLit] = useState(false);
  const clipRef = useRef<HTMLVideoElement>(null);

  // The whole screen waits as one. Half of it arriving before the other half
  // is two layout shifts where the design asks for none.
  if (!found) return <OfferLoading />;

  const { now, was } = priced(view, id);
  const tier = tierByPrice(was ?? now);
  const name = found.name ?? '';
  const at = name.lastIndexOf(' ');
  const clip = family?.levels.find((l) => l.id === level)?.video ?? found.video;
  // #t= is a media fragment: it tells the browser which frame to sit on before
  // anyone presses anything. Measured across five clips, two of them open on a
  // fade from black — Elderflame and Glitchpop are at 19 and 18 of 255 at
  // frame zero — so a still of frame zero is a black box for no reason. Past
  // the fade every clip is showing the weapon. It also makes iOS decode and
  // paint a frame at all, which with preload=metadata alone it does not.
  const still = clip ? clip + '#t=' + STILL : undefined;
  // The base colourway until a swatch is tapped, so the block is there from
  // the first frame rather than appearing under your thumb.
  // Only when there is more than one: a swatch row of one is not a choice.
  const variant = family && family.chromas.length > 1 ? chosen(family, chroma ?? '') : null;
  // And the weapon itself, below. The stage is a clip of somebody holding it
  // in a corridor, which is not a picture of the gun — so when there is a clip
  // the render goes underneath, whether or not there is a colourway to pick.
  // Without a clip the stage already is the render, and a second one would be
  // the same picture twice.
  const below = clip ? (variant?.render ?? found.icon) : (variant?.render ?? null);
  // Same for the chip. "Level 1" on a skin that has exactly one level is a
  // label that answers a question nobody could have had.
  const chip = family && family.levels.length > 1 ? chipFor(family, level) : null;
  // The render is a Ghost or an Odin and the row it came from knows which;
  // without this the pistol arrives on the stage the size of a rifle.
  const style = { ...artStyle(art), '--gun': String(found.scale) } as Record<string, string>;

  return (
    <main class={art ? 'screen offer offer--lit' : 'screen offer'} style={style}>
      <button type="button" class="back" onClick={back}>
        <span class="offer__chev">
          <Chevron />
        </span>
        {t().common.nav.store}
      </button>

      <div class="offer__stage stage" style={style}>
        {/* The render stands behind the clip and shows through until the clip
            has a frame — that is the black flash, and it is also the whole
            answer for a skin with no clip at all. Same picture either way, so
            nothing moves when the video arrives over the top of it. */}
        {found.icon && <img class="offer__art" src={found.icon} alt="" />}

        {clip && (
          // Riot's own, streamed from their CDN — they are 13 MB each and this
          // page has no business holding a copy. Our control at rest, theirs
          // once it is running, because pause and scrub are not worth drawing.
          // Riot publishes no caption track for these and there is nothing to
          // caption: a weapon inspect is music and sound effects with no
          // speech in it, and an empty <track> would claim captions exist.
          // biome-ignore lint/a11y/useMediaCaption: no speech, and no track to point at
          <video
            ref={clipRef}
            class={lit ? 'offer__clip offer__clip--lit' : 'offer__clip'}
            src={still}
            preload="metadata"
            playsInline
            controls={playing}
            onLoadedData={() => setLit(true)}
            onPlay={() => setPlaying(true)}
          />
        )}

        {clip && !playing && (
          <button type="button" class="offer__play" aria-label={s.watch} onClick={start}>
            <Play />
          </button>
        )}
        {/* Follows the pill, not the offer: the chip names what is on screen. */}
        {chip && <span class="offer__level num">{chip}</span>}
      </div>

      <div class="offer__id">
        <div class="offer__who">
          <h1 class="offer__name">
            {at > 0 ? <span>{name.slice(0, at)}</span> : name}
            {at > 0 && <span>{name.slice(at + 1)}</span>}
          </h1>
          {tier && (
            <p class="offer__tier">
              <img src={tier.icon} alt="" width="14" height="14" />
              {t().common.tier[tier.name]}
            </p>
          )}
        </div>

        <div class="offer__paid">
          <span class="offer__price">
            <Money amount={now} size={17} />
          </span>
          {was !== null && was !== now && <Money amount={was} struck size={11} />}
        </div>
      </div>

      {family && (
        <>
          <Levels family={family} on={level} pick={setLevel} />
          <Variants family={family} on={chroma ?? family.chromas[0]?.id ?? ''} pick={setChroma} />
        </>
      )}

      {below && (
        <div class="offer__variant stage" style={artStyle(art)}>
          <img src={below} alt={name} />
        </div>
      )}

      <p class="legal offer__note">{s.clips}</p>
    </main>
  );

  function start() {
    const video = clipRef.current;
    if (!video) return;
    // Back to the beginning: the still is a frame chosen to look like
    // something, and pressing play means play the clip, not the rest of it.
    video.currentTime = 0;
    void video.play();
  }
}

/** What this skin costs, and what it cost before, from whichever of the three
 *  places it was opened from. `was` is null in the daily store, which sells at
 *  one price and never shows a second number. */
function priced(view: StoreView, id: string): { now: number | null; was: number | null } {
  const daily = view.offers.find((o) => o.id === id);
  if (daily) return { now: daily.cost, was: null };

  const night = view.night?.items.find((o) => o.id === id);
  if (night) return { now: night.price ?? night.cost, was: night.cost };

  const packed = view.bundles.flatMap((b) => b.items).find((it) => it.id === id);
  if (packed) return { now: packed.price ?? packed.base, was: packed.base };

  return { now: null, was: null };
}
