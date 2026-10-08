---
name: valoox-design
description: Build a valoox screen to the artboard — tokens, the 107° weave, measured colour, the four shapes, the six states and the loading rules. Load this before writing or changing anything under web/.
---

# Building a screen

`DESIGN.md` is the why. This is the how.

Read these before you start, in this order: the screen's row in
`design/boards.md`, the board itself in the canvas, then `design/tokens.css`.

## Never write a value

Every colour, size and radius is already a token. If you are about to type a hex,
a `px` font-size or a `border-radius`, you are either reaching for something that
exists under another name or inventing a thirteenth grey. Open `tokens.css`.

The three exceptions, and they are the only ones: a measured colour (which
arrives as data), a one-off geometry that belongs to one component (a 214px QR
box), and `1px` for a hairline.

## Colour arrives measured

```ts
import { measure } from '../design/measure.ts';

node.className = 'stage';
node.style.setProperty('--art', await measure(skin.render)); // "104, 92, 158"
```

`--art` is `r, g, b` without the `rgb()`, because `.stage` needs four alphas of
it. Setting it through `style.setProperty` is CSSOM, which the CSP permits; a
`style` attribute is not, and would be blocked.

**The algorithm, which is not a plain average.** Draw the image into a 48×48
canvas and read it back. For each pixel with alpha ≥ 0.12, weight it by
`alpha × (0.18 + chroma × 1.6)` — a near-black or near-white pixel carries no hue
and must not drag the mean toward the outline or the glow. Take the hue and the
value from that weighted mean. Take the **saturation from the 88th percentile**
of the pixels' saturations, not from the mean: a mean saturation over a whole
picture is always grey and would hand every skin the same wash. Clamp saturation
to 0.42–0.92 and value to a floor of 0.62.

**`design/palette.json` is the fixture.** It holds 57 colours measured offline by
the same rule. `measure('v-reaver-vandal.png')` must return `104, 92, 158`. If a
change to `measure.ts` moves any of those numbers, the change is wrong.

The images come from `valorant-api.com`, which sends the CORS header that makes
`getImageData` legal. Load with `crossOrigin = 'anonymous'` or the canvas taints
and the read throws.

## The weave

One class. `.stage` for anything with art on it, plus `.stage--row` when it is a
row in a list rather than a tile. Nothing else draws a gradient.

A title has no art, so it keeps the white default and that is correct, not a
fallback.

## The four shapes

Shape follows the kind of thing, never the slot it came from:

| Shape | For | Grid |
| --- | --- | --- |
| Letterbox row | a rifle | one column |
| Square tile | a knife, a spray, a charm | three |
| Portrait | a card | two |
| Text row | a title | one |

This is what lets a random accessory drop and a ten-piece bundle share one grid.
If you are reaching for a fifth shape, you have found a new *kind* of thing —
check that, because the catalogue only has four.

## The six states

Yours · Not yours · Equipped · Verified · Not verified · Refused.

There is no seventh. In particular there is no **delivered**: a server cannot see
whether a message was read, so a send reports the status the provider returned
and stops there. Do not add a check mark that implies more.

Not-yours is 55% opacity and a hollow star — present, dimmed, still openable.
Never hidden, never disabled.

## Loading

Four rules, and they are the ones most likely to be broken by accident:

1. **One grey, no shimmer.** `--raised`, nothing else. A skeleton that animates is
   asking to be looked at, and it is the one thing on screen with nothing to say.
2. **Final sizes, always.** Every placeholder is already the size the real thing
   will be, so nothing jumps when the data lands. Where the shape genuinely
   cannot be known — a bundle holds four to ten pieces — the screen says so
   rather than guessing.
3. **Draw whatever needs no data.** Tab bar, back link, the address already
   saved: all real. Only what is in flight is grey, which is what makes the grey
   mean something.
4. **A dead control says it is dead.** A search over a catalogue that has not
   arrived is drawn, disabled, and labelled with why.

Every screen with data has a loading board in `design/boards.md`. Build it in the
same commit, not later.

## What the CSP forces

- No `innerHTML`, no `insertAdjacentHTML`, no `document.write`. Item names come
  from a community database; those are stored XSS with extra steps.
- No `style` attribute. Colours go through `style.setProperty`.
- No third-party origin at all — no CDN, no font host, no icon service. The fonts
  are self-hosted from `/fonts/`; `npm run fonts` fetches them.
- `img` may load from `media.valorant-api.com` and nothing else.

`test/unit/seams.test.ts` fails the build on every one of these.

## Before you call it done

- Open the board at 390px next to the screen. They match or it is not finished.
- Check the light twin. `.stage` keeps `color-scheme: dark`, so art stays on a
  dark ground while the chrome goes light — if a render has gone pale, something
  lost that class.
- `npm run check`. Nothing over 200 lines, no text outside `web/i18n/`.
