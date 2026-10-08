# valoox

A VALORANT player's own store and collection, from a phone, without opening the
game. One Cloudflare Worker on the free plan.

`PRODUCT.md` says what it is for. `DESIGN.md` says what it looks like and why.
This file says what you may not break.

## The invariants

These are not preferences. Each one is load-bearing, and most have a test behind
them — if you need to change one, change the test in the same commit and say why
in the message.

**The password is never handled, stored, or asked for.** Sign-in is Riot
Mobile's QR flow, approved inside Riot's own app. No screen has a password field,
so there is nothing here to phish.

**Every outbound request goes through `src/vault/http.ts`.** It is the only
module that calls `fetch()`, and its first act is `assertAllowed(method, url)`
against the list in `src/vault/upstream.ts`. A new rule carries a `why:` in
plain words. Endpoints that *change* something — buy, equip, queue, party, chat —
are absent on purpose, which is what makes "read-only" checkable instead of
promised.

**The session is sealed before it reaches the database.** AES-256-GCM under a key
derived per browser (HKDF, `info = "jar:" + uid`), with `kid|uid` as additional
data so a row swapped into another row's place fails closed. `JAR_KEY` lives in
the Worker's secrets, never in D1. Rotating it is the kill switch: every existing
ciphertext becomes undecryptable at once, so it must take effect immediately —
nothing may cache a key across a rotation.

**The jar never reaches the browser, and never reaches a log.** Neither does the
puuid, the access token, or any URL that contains one. `[observability] enabled =
false` in `wrangler.toml` is part of this, not a tuning choice: the storefront
path carries the puuid and Workers Logs would persist it.

**The Worker parses no catalogue.** Names, renders, tiers and clips are joined in
the browser against `valorant-api.com`. A Worker gets 10ms of CPU per request;
that one number decided the architecture, and the daily job is a set intersection
for the same reason.

**The page builds DOM, never HTML from strings.** Item names come from a
community database this project does not control. CSP is `default-src 'none'`
with `script-src 'self'` and no `unsafe-inline`, so colours are set through
CSSOM (`style.setProperty`), never a `style` attribute.

**Nothing loads from a third party.** No CDN, no font host, no analytics, no
embedded widget. Three off-origin hosts, all of them Riot's own content and
each pinned to one CSP directive: `valorant-api.com` for the catalogue
(`connect-src`), `media.valorant-api.com` for artwork (`img-src`), and
`valorant.dyn.riotcdn.net` for the skin clips (`media-src`). `media-src`
streams audio and video and executes nothing; the clips are 13 MB each and
keeping copies of them is the alternative. No other directive names a host,
and `script-src` is exactly `'self'`.

## The two mechanical rules

**No file over 200 lines.** `test/unit/size.test.ts` fails the build. If a module
is pushing the limit it is doing two jobs; split it along the seam, do not
reformat to fit.

**No user-facing text outside `web/i18n/`.** `test/unit/strings.test.ts` fails the
build. Interpolation is a function, not concatenation:

```ts
// no
'Quedan ' + n + ' ofertas'
// yes
restantes: (n: number) => `Quedan ${n} ofertas`
```

`es/` is the source locale and the one served. `en/` exists and is filled.

## What the copy may not say

The product's whole argument is that its claims are checkable, so a claim it
cannot back costs more than it buys.

| Never | Because |
| --- | --- |
| "zero-knowledge", "zero data stored" | Both are false. One row exists. |
| "we can't see it" | We seal it. That is a different sentence. |
| "secure" | It describes nothing. Name the property instead. |
| "revoked", on its own | Disconnecting deletes *our* access. Riot's session lives until it expires, and people make security decisions on that word. |
| "delivered", about an email | A server cannot observe an inbox. Report the status the provider returned and stop. |

Say what the code does. If a sentence cannot be traced to a line, cut it.

## The map

```
src/                 the Worker
  index.ts           fetch + scheduled, nothing else
  router.ts          the route table
  routes/            auth · store · collection · wishlist · alerts · account
  vault/
    upstream.ts      the egress allowlist          <- read this first
    http.ts          the only fetch() in the repo
    seal.ts          HKDF per uid + AES-256-GCM
    jar.ts           cookie in, Set-Cookie out
    session.ts       the only thing that persists
    repo.ts          D1
    riot/            auth qr storefront wallet loadout owned offers shard
  alerts/
    cron.ts          the daily job, with its circuit breaker
    match.ts         wishlist ∩ storefront
    otp.ts           six digits, ten minutes, five attempts
    mail/            send · alert · code · layout
  lib/               json errors time

web/                 the browser app. TypeScript, bundled to public/app.js
  main.ts            mount and route
  i18n/              index · es/* · en/*
  design/            tokens · weave · measure · shapes
  components/        the four shapes, nav, chips, skeleton, states
  screens/           one per artboard
  data/              api · catalogue · cache

public/              served as-is by [assets]
  index.html  app.css  _headers  .well-known/
  app.js             build artifact, gitignored
  fonts/             fetched by `npm run fonts`, gitignored

design/              the spec: DESIGN.md, tokens.css, palette.json, boards.md
```

Two directories divide the Worker: `src/vault/` is anything Riot-facing,
everything else is not. A Riot hostname outside `src/vault/` fails the build.

Module names are lowercase and single-word, no suffixes: `seal.ts`, not
`sealService.ts`.

## Running it

```sh
npm ci
npm run fonts        # once — downloads the two faces into public/fonts/
npm run dev          # builds web/ then starts the Worker
npm run check        # typecheck + lint + tests + build. What CI runs.
npm run deploy       # builds, then wrangler deploy
```

### On a phone

This is a phone app and it has to be looked at on one. `npm run phone` puts the
dev server behind Tailscale:

```sh
npm run phone        # once; the config persists
npm run dev
```

Then open `https://<machine>.<tailnet>.ts.net` on the phone — `tailscale status`
names it. `npm run phone:off` takes it down.

It has to be HTTPS, which is the whole reason this is not just `--ip 0.0.0.0`:
the `uid` cookie is `Secure`, so over plain http on a tailnet address the
browser never stores it and sign-in silently never completes. Tailscale serves a
real certificate for the MagicDNS name, so the cookie behaves exactly as it will
in production.

Nothing is exposed beyond the tailnet. `wrangler dev` stays bound to 127.0.0.1
and the proxy runs on the same machine. **Never `tailscale funnel`** — that is
the public internet, pointed at a dev server holding a real Riot session.

The kill switch, which makes every stored session undecryptable and signs
everybody out:

```sh
npx wrangler secret put JAR_KEY
```

## Commits

Conventional prefixes, lowercase subject, written as a claim rather than a label
("make the checks pass what CI actually runs", not "fix CI"). Bodies are long
where the change deserves it: what was measured, what was rejected, and why.

Author is `NicolasV7 <159790870+NicolasV7@users.noreply.github.com>`. **Never add
an AI co-author trailer.**

`git checkout legacy-operator-terminal` is the app as it stood before the rewrite
from the artboards.
