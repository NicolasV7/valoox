// Inspecting a gun, before the catalogue answers.
//
// Every box is already its final size, so nothing jumps when the names land.
// The back link is a hole too: which weapon this skin belongs to is a thing
// only the index knows, and Riot answers with ids that do not say.

import { Chevron } from '../components/icons.tsx';
import { t } from '../i18n/index.ts';

const STEPS = [0, 1, 2, 3];

export function SkinLoading() {
  return (
    <main class="screen vary">
      <span class="back">
        <span class="back__chev">
          <Chevron />
        </span>
        <span class="skel vary__back--waiting" />
      </span>

      <div class="reel reel--waiting">
        <span class="skel reel__play--waiting" />
      </div>

      <div class="vary__id">
        <div>
          <span class="skel vary__word--waiting" />
          <span class="skel vary__word--waiting" />
          <span class="skel vary__tier--waiting" />
        </div>
        <div class="vary__has">
          <span class="skel vary__yes--waiting" />
          <span class="skel vary__list--waiting" />
        </div>
      </div>

      <div class="vary__band">
        <h2 class="label">{t().offer.levels}</h2>
      </div>
      <div class="steps">
        {STEPS.map((step) => (
          <span class="skel step step--waiting" key={step} />
        ))}
      </div>

      <div class="vary__band">
        <h2 class="label">{t().offer.variants}</h2>
      </div>
      <div class="swatches">
        {STEPS.map((step) => (
          <div class="swatch swatch--waiting" key={step}>
            <span class="skel swatch__dot--waiting" />
            <span class="skel swatch__of--waiting" />
          </div>
        ))}
      </div>

      <div class="vary__band">
        <h2 class="label">{t().skin.equippedNow}</h2>
      </div>
      <div class="slab slab--waiting" />

      <p class="legal vary__under">{t().skin.waitingWhy}</p>
    </main>
  );
}
