# Design

The spec is the canvas: 122 artboards at
[claude.ai/artifact/JdhyhhmhsdoEtc9UxFLYYB](https://claude.ai/artifact/JdhyhhmhsdoEtc9UxFLYYB).
This file is the part of it that has to survive without the link —
`design/boards.md` maps every screen to its board.

Values live in `design/tokens.css`, once. Nothing below restates a hex.

## The world

The interface spends no colour. The game does. Every colour on screen is either
Riot's or measured off Riot's art, which is why this is mostly rules about where
a value came from rather than a list of values.

That is also the answer to Riot's policy, which forbids implying official
affiliation: the content is theirs and reads as theirs, the chrome is ours and
reads as nothing in particular.

## The mark

The name has two o's in the middle and the app has one idea running through
every screen: what is yours and what is not. So the o's carry it — one filled,
one an open ring. Owned, and not owned.

They sit tangent, not overlapping, because overlap turns to mud below about 20px
and this has to survive a favicon. The solid is drawn a hair smaller than the
ring: a filled circle reads larger than an outlined one of the same diameter.

The word is set in the UI face at the weight a label uses, lowercase, so the mark
is the only thing in the lockup asking for attention.

## Type

**Bricolage Grotesque** for everything a person reads. Four weights: 200 for a
screen title, 300 for a heading, 500 for a label or a button, 400 for the rest.

**Azeret Mono** for numbers, and only for numbers. Tabular figures are the whole
point: a countdown that shifts sideways every second reads as broken.

Both are self-hosted from `/fonts/` — the CSP names no third-party origin, and
`seams.test.ts` fails the build if one appears. `npm run fonts` fetches them;
they are not committed.

**The email is the exception.** No web font loads reliably in a mail client, so
the mails are designed in the system stack they will actually get.

| Role | Size / weight |
| --- | --- |
| Screen title | 32 / 200 |
| Section title | 28 / 300 |
| Item name | 20 / 500 |
| Body | 15 / 400 |
| Secondary | 13 / 400 |
| Label | 12 / 500, uppercase, tracked |
| Floor | 11 / 400 |

Eleven is a hard floor. Anything a person reads or taps stays at or above it,
footers included.

## Colour is data

The interface has one near-black and one near-white. Everything else came from
somewhere:

- **Five tier hues** are Riot's own, from `/v1/contenttiers`.
- **Everything else is measured.** One `drawImage` into a 1×1 canvas gives the
  average of an image. The hue is kept; the saturation is taken from the art's
  vivid end, because a mean saturation over a whole picture is always grey and
  would hand every skin the same wash. `valorant-api.com` sends the CORS header
  that makes reading the pixels back legal.

The melee grid is the clearest case for why: every melee Riot has ever sold is
Exclusive, so without measurement the whole slot is one orange.

`design/palette.json` holds 57 of these, measured offline. It is a reference for
building screens, not a runtime dependency — the app measures what it draws.

## The weave

One angle, **107°**, everywhere a piece of art sits on a surface. The bands and
the wash take the piece's own colour, so the same skin looks like the same object
in the store, in the collection and in an alert.

In code it is one class and one custom property:

```js
node.className = 'stage';
node.style.setProperty('--art', '104, 92, 158');
```

A title gets the white default, because a title genuinely has no art to read.

## The four shapes

Shape follows the kind of thing, never the slot it came from. That is what lets
a random accessory drop and a ten-piece bundle share one grid.

| Shape | For |
| --- | --- |
| Letterbox row | a rifle |
| Square tile | a knife, a spray, a charm |
| Portrait | a card |
| Text row | a title |

A card gets two columns; a spray gets three.

## The six states

| State | How it reads |
| --- | --- |
| Yours | a tick, never a badge |
| Not yours | 55% opacity, hollow star. Present, dimmed, still openable |
| Equipped | a light chip on the art. One per slot |
| Verified | the address carried a code back |
| Not verified | saved, and nothing is sent to it yet |
| Refused | the channel's own status code, shown as received |

There is no seventh, and the missing one is deliberate: **delivered**. A server
cannot see whether a message was read, so nothing claims it. The strongest thing
a send can say is the status the channel returned.

## Waiting

- **One grey, no shimmer** — on a screen you are reading. `--raised` and nothing
  else. A skeleton standing in for text competes with the thing you came for,
  and it is the one element on screen with nothing to say.

  The exception is narrow: a screen whose *entire* content is "wait a second"
  has nothing to compete with. The code arriving, and the bars under "you're
  in", may breathe. Anywhere else they hold still.
- **Final sizes, always.** Every box is already the size the real thing will be,
  so nothing jumps when the data lands. Where the shape genuinely cannot be known
  — a bundle holds between four and ten pieces — the screen says so rather than
  guessing.
- **Draw whatever needs no data.** The tab bar, the back link, the address you
  already saved: all real. Only what is in flight is grey, which is what makes
  the grey mean something.
- **A dead control says it is dead.** The search on a loading slot is drawn and
  disabled, reading "waiting for the catalogue". A field that silently does
  nothing is worse than one that admits it.

## Light

A token remap, not a second design — possible only because nothing was picked ad
hoc. `light-dark()` carries both values on one line in `tokens.css`.

The one thing a table cannot decide is what to do with the art. A VALORANT render
is lit for a dark background; recolouring it would be editing Riot's artwork, and
dropping it on near-white leaves a Singularity Vandal as a pale smear. So
**anything carrying the weave stays dark**: `.stage` declares `color-scheme:
dark`, and every `light-dark()` in its subtree resolves dark with it. The light
theme is light chrome around dark stages.

## Motion

Almost none, and never decorative. State changes get 120ms. Everything respects
`prefers-reduced-motion`.
