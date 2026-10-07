# Design

## The world: operator terminal

An instrument, not a storefront. The player is checking a readout, deciding in
seconds, usually one-handed. It should feel closer to a trading terminal or a
flight computer than to a game's shop screen — precise, dense, quiet, and fast
to parse.

Deliberately **not** VALORANT's visual identity. Riot's policy forbids implying
official affiliation, and imitating their red-and-angular brand is exactly what
that looks like. The game's content is the data; the chrome is ours.

## The one rule: colour means something

The interface is achromatic. Every coloured pixel is data, and the colour comes
from the data itself:

| Hue | What it means | Source |
|---|---|---|
| tier colours | a skin's rarity | `valorant-api.com/v1/contenttiers` |
| rank colour | your competitive tier | `valorant-api.com/v1/competitivetiers` |
| gold | you marked it | ours |
| green | you already own it | ours |
| red | something failed | ours |

No brand accent exists, so nothing competes with the five tier hues — which is
also why those hues read instantly instead of becoming decoration.

## Palette

```
--void    #0A0C0D   the page
--panel   #13171A   raised surface
--rule    #222A2F   borders, dividers
--line    #2E383E   stronger border, focus
--ink     #E7ECEE   primary text
--dim     #8B979D   secondary text
--faint   #5A6469   labels, disabled
--gold    #E3B341   favourited
--green   #58C98A   owned
--red     #E5574F   error
```

Neutrals carry a slight cyan cast, so the ground reads cool and engineered
rather than muddy, and the tier hues sit on it without fighting.

## Type

System stacks, zero bytes, no font host — which the CSP would block anyway
without opening `font-src`. On an instrument the platform's own monospace is the
correct material, not a compromise: the discipline carries the personality.

- **Data** — `ui-monospace, 'SF Mono', 'Cascadia Mono', 'Segoe UI Mono', Menlo,
  Consolas, monospace`. Every number, price, countdown, label and identifier.
  Always `font-variant-numeric: tabular-nums` so columns of digits line up.
- **Prose** — `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Item
  names, explanations, trust copy.

Scale: 11 / 12 / 13 / 15 / 19 / 26. Micro-labels are 11px uppercase with
`.14em` tracking. Nothing is bold for emphasis alone; weight marks hierarchy.

## Composition

Single column, mobile-first, 16px gutters. The status line sits at the top: who
you are and where you rank, then your three balances and the rotation countdown,
all mono and tabular. Then the four daily offers, above the fold, without
scrolling — that is the whole job.

Offers are **rows**, not cards. A row fits a readable name, a tier bar, a wide
weapon render and a right-aligned tabular price in the width of a phone; a card
grid wastes that width on padding and truncates the names.

A 3px tier-coloured bar on the leading edge of every item is the one recurring
structural device. It is the only place rarity appears, so it does real work.

## Motion

Almost none, and never decorative. State changes get a 120ms ease; `<details>`
open with the browser's own behaviour. Everything respects
`prefers-reduced-motion`.
