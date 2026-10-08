# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## What it is

valoox shows a VALORANT player their own daily store, bundles, accessory store
and collection from a phone, without opening the game or turning on a PC.

## Unique mechanism

Riot publishes no store API. The app signs in through Riot Mobile's QR flow — so
it never handles a password — and reads the player's own storefront with the
session that returns. That session is a bearer credential that bypasses 2FA, so
custody of it is the product's central design problem, not an implementation
detail.

## Audience and scene

Public: anyone with the link. A player checking, on a phone, usually once a day,
usually in under ten seconds, often while doing something else. They want to know
whether today is worth spending on.

## Primary task

See today's four daily offers. Everything else — bundles, accessory store,
collection, favourites — is secondary and reached deliberately.

## Jobs, in priority order

1. Is any of today's store worth my money?
2. Did something I'm waiting for show up?
3. What do I already own, and what is it worth?
4. Sign in, and understand what I just handed over.

## States that must be designed, not improvised

- Signed out, first time: a stranger is about to scan a QR that logs into their
  game account. Trust is earned here or the product fails.
- Session expired: happens every two to three weeks, always unannounced.
- Night Market absent: true most of the year, not an error.
- Nothing favourited yet; nothing owned in a category.
- Riot unreachable or rate-limiting.

## Constraints that shape the design

- Content Security Policy is `default-src 'none'` with `script-src 'self'`,
  `style-src 'self'` and `font-src 'self'`, no `unsafe-inline`. No inline style
  attributes, no third-party script, no webfont host — the two faces are
  self-hosted and `npm run fonts` fetches them. Colour that is data is set
  through CSSOM.
- Preact, bundled by esbuild into one file. `innerHTML` is banned because item
  names come from a community database, and `test/unit/seams.test.ts` fails the
  build if one appears.
- No file over 200 lines, and no user-facing string outside `web/i18n/`. Both
  are tests, not conventions.
- The Worker parses no catalogue: names, icons, tier colours and rank art are
  resolved in the browser against valorant-api.com.
- Riot's policy forbids implying official affiliation, so the interface must not
  imitate VALORANT's brand identity.

## Non-goals

Buying anything. Anyone else's data. Scouting opponents. Match history.
