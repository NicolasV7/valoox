// A skin, opened out of the collection.
//
// Deliberately the same three blocks as the store's offer screen — clip,
// levels, colourways — because it is the same question: what does this
// actually look like. What changes is the answer to "do you own it", which the
// store never has to give, and which is the only reason this is a second
// screen rather than a flag on the first.
//
// One screen for a gun and for a knife. Three things differ and all three are
// read off the payload: how many levels there are, whether a colourway ships a
// clip of its own, and how the render sits in the box at the bottom.

import { useRef, useState } from 'preact/hooks';
import { Back } from '../components/Back.tsx';
import { Check, Play } from '../components/icons.tsx';
import { Money } from '../components/Money.tsx';
import { priceOf, tierOf } from '../data/tiers.ts';
import type { Inventory } from '../data/types.ts';
import { useSkinOf } from '../data/useIndex.ts';
import { useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { chipFor } from './Offer.levels.tsx';
import { SkinLoading } from './Skin.loading.tsx';
import { Colours, Levels } from './Skin.picks.tsx';
import { Worn } from './Skin.worn.tsx';

/** Riot grants a level and a colourway under two different item types, which
 *  is why one skin arrives as several ids and why this screen asks twice to
 *  know what you hold. */
const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
const COLOURS = '3ad1b2b2-acdb-4524-852f-954a76ddae0a';

/** Seconds into the clip to sit on while it is still — past the fade from
 *  black that two of the five clips measured open on. */
const STILL = 1.2;

export function Skin({ id, inv }: { id: string; inv: Inventory }) {
  const s = t().skin;
  const found = useSkinOf(id);
  const [level, setLevel] = useState(id);
  const [colour, setColour] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState(false);
  const [secs, setSecs] = useState<number | null>(null);
  const clip = useRef<HTMLVideoElement>(null);
  const art = useArt(found?.skin.render);

  if (!found) return <SkinLoading />;
  const { weapon, skin } = found;
  // Null cost is the index's own mark for a melee: it is the one thing in the
  // rack the buy menu does not sell.
  const melee = weapon.cost === null;
  const tier = tierOf(skin.tier);

  const held = new Set(inv.byType[LEVELS] ?? []);
  const kept = new Set(inv.byType[COLOURS] ?? []);
  const mine = skin.levels.some((l) => held.has(l.id));

  const on = skin.chromas.find((c) => c.id === colour) ?? null;
  const step = skin.levels.findIndex((l) => l.id === level);
  const reel = on?.video ?? skin.levels[step]?.video ?? null;
  // #t= is a media fragment: which frame to sit on before anyone presses
  // anything, and on iOS the thing that makes a frame get decoded at all.
  const still = reel ? reel + '#t=' + STILL : undefined;

  const name = skin.name;
  const at = name.lastIndexOf(' ');

  return (
    <main class={tier ? 'screen vary vary--lit vary--' + tier.name : 'screen vary'}>
      <Back to={{ name: 'weapon', id: weapon.id }} said={weapon.name} />

      <div class="reel">
        {reel ? (
          // biome-ignore lint/a11y/useMediaCaption: no speech, and no track to point at
          <video
            ref={clip}
            class={lit ? 'reel__clip reel__clip--lit' : 'reel__clip'}
            src={still}
            preload="metadata"
            playsInline
            controls={playing}
            onLoadedData={() => setLit(true)}
            onLoadedMetadata={(e) => setSecs((e.currentTarget as HTMLVideoElement).duration)}
            onPlay={() => setPlaying(true)}
          />
        ) : (
          skin.render && <img class="reel__still" src={skin.render} alt="" />
        )}

        {reel && !playing && (
          <>
            <span class="reel__scrim" />
            <button type="button" class="reel__play" aria-label={s.watch} onClick={start}>
              <Play />
            </button>
            <span class="reel__of num">{chip()}</span>
            {secs !== null && <span class="reel__long num">{clock(secs)}</span>}
          </>
        )}
      </div>

      <div class="vary__id">
        <div>
          <h1 class="vary__name">
            {at > 0 ? <span>{name.slice(0, at)}</span> : name}
            {at > 0 && <span>{name.slice(at + 1)}</span>}
          </h1>
          {tier && (
            <p class="vary__tier">
              <img src={tier.icon} alt="" width="14" height="14" />
              {t().common.tier[tier.name]}
            </p>
          )}
        </div>
        <div class="vary__has">
          <span class={mine ? 'vary__yes' : 'faint'}>
            {mine && <Check size={14} />}
            {mine ? s.yours : t().common.notOwned}
          </span>
          <span class="vary__list">
            <Money amount={priceOf(tier?.name, melee)} size={14} />
          </span>
        </div>
      </div>

      <Levels skin={skin} on={level} pick={pick} melee={melee} />
      <Colours skin={skin} on={colour} kept={kept} pick={setColour} />
      <Worn skin={skin} weapon={weapon} inv={inv} mine={mine} melee={melee} art={art} />

      <p class="legal vary__note">{s.listPrice}</p>
    </main>
  );

  /** A level and a colourway are two different clips, so choosing one drops
   *  the other: the box shows what you last asked for and says which it is. */
  function pick(next: string) {
    setLevel(next);
    setColour(null);
    setPlaying(false);
    setSecs(null);
  }

  /** What the box is showing. A colourway's own clip names the colourway,
   *  because that is what you asked for; otherwise it is the level. */
  function chip(): string {
    return on ? (on.colour ?? t().offer.original) : chipFor(skin, level);
  }

  function start() {
    const video = clip.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  }
}

/** mm:ss, from the clip's own metadata. Nothing claims a length until the
 *  browser has read one. */
function clock(secs: number): string {
  const whole = Math.round(secs);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}
