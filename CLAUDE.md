# valoox

A VALORANT player's own store and collection, from a phone, without opening the
game. One Cloudflare Worker on the free plan.

`PRODUCT.md` says what it is for. `DESIGN.md` says what it looks like and why.
This file says what you may not break.

## The invariants

These are not preferences. Each one is load-bearing and has a test. If one
changes, change the test in the same commit and explain why in the message.

**The password is never handled, stored, or asked for.** Sign-in is Riot
Mobile's QR flow, approved inside Riot's own app. There is no password field.

**Every outbound request goes through `src/vault/http.ts`.** It calls
`assertAllowed(method, url)` against `src/vault/upstream.ts` before any fetch.
Redirects stay manual even if a caller requests otherwise. New rules carry a
`why:` in plain words. Buying, equipping, queueing, parties and chat are absent.
Authentication writes are separate from reading the player's game data.

**A database identifier is never a login credential.** The browser holds a
256-bit `__Host-val` secret, Secure, HttpOnly, SameSite=Strict, Path=/ and with
no Domain attribute. D1 and KV hold only keyed fingerprints, never that secret.
Successful QR approval rotates it. Old `uid` cookies cannot authenticate.
A legacy cookie may nominate preferences only after a fresh Riot QR confirms
the same account. Do not adopt an old jar or unverified email code.

**Private state is sealed before storage, with separate purposes.**
AES-256-GCM uses fresh 96-bit IVs; HKDF and authenticated data bind the browser
identifier, key version and purpose/schema. Session, store, inventory, QR, stop
link and outbox keys are distinct. Caches also validate their public DTO shape.
`JAR_KEY` is a 32-byte secret outside D1. A rotation immediately changes lookup
identifiers and invalidates every old ciphertext. Cache derivations by the raw
secret, never across a rotation.

Account wishlists use `wishlist:1`, bound to the verified account fingerprint.
Share only after decrypting an authenticated Riot identity. Merge device changes
under CAS and update all browser job flags atomically; destinations retain their
own consent. Remove the shared list after its last session ends. A stale session
writer cannot replace the authoritative list or its consent-derived job flags.

**D1 decides authentication and revocation.** Check it before returning a
private KV view. A delayed KV deletion cannot undo logout. Disconnect atomically
deletes the session and pending QR. Approval can commit only a live, exclusively
claimed scan generation. Scans expire ten minutes after creation; polling does
not extend that deadline. Every session mutation uses a monotonic CAS version
and writes its alert flag in the same statement.

**Security counters and consumption are atomic.** OTP has five attempts in ten
minutes, a keyed digest bound to browser, recipient and generation, and one
transaction for consumption and verification. Recipient/account sending quotas
also live in D1. Stop links expire, bind the mail generation and consume one
answer atomically with removal. Signed provider events act only on their
reserved message generation; failed CAS must permit a useful provider retry.

**The jar never reaches the browser or a log.** Neither does the puuid, access
token, ciphertext or a URL containing one. Log fixed categories/statuses,
never exception messages or stacks. `[observability] enabled = false` in
`wrangler.toml` is load-bearing: storefront paths contain the puuid.

**The Worker parses no catalogue.** Names, renders, tiers and clips are joined
in the browser against `valorant-api.com`. The Worker has a small CPU budget.
Alerts use UUID intersections, including typed accessory ids.

**The job has a request budget.** An invocation spends at most 48 external
requests, including retries and aborted calls. Process fair batches after
00:30 UTC and continue every fifteen minutes. Combine browser lists per account
and destination; reserve one delivery per daily rotation. Retries use an
encrypted immutable outbox and Resend idempotency, without re-polling Riot.
Discord uses the same budget, bounded retries and provider cooldowns. Its short
nonce deduplication window is not an exactly-once guarantee.

**The page builds DOM, never HTML from strings.** Community item names are
untrusted. CSP is `default-src 'none'`, `script-src 'self'`, without
`unsafe-inline`. Colours use CSSOM, never a style attribute. Clear all private
browser state and invalidate outstanding requests when authentication changes.
A failed logout must not show a confirmed disconnect.

**All code and fixed assets load from this origin.** No external scripts,
fonts, analytics or widgets. Fixed artwork is self-hosted. Three rotating
content hosts are narrowly pinned: the community catalogue at
`valorant-api.com` (connect-src), its artwork at `media.valorant-api.com`
(img-src), and Riot's clips at `valorant.dyn.riotcdn.net` (media-src).

## The two mechanical rules

**Every authored source has fewer than 200 lines**, including comments and
blank lines. Split along a responsibility boundary; do not reformat to fit.
`test/unit/size.test.ts` covers application code, scripts, tests, migrations,
workflows and configuration. Generated bundles/types, the standalone Archify
diagram and its model, and the measured palette are artifacts outside this limit.

**No user-facing text outside `web/i18n/`.** Interpolation is a function:

```ts
remaining: (n: number) => `${n} offers left`
```

English is the source and fallback locale. Spanish is an es-419 translation
with the same keys; the browser's language preference selects the bundle.
Code, comments, documentation and commit messages are English.

## What the copy may not say

| Never | Because |
| --- | --- |
| "zero-knowledge", "zero data stored" | Both are false. |
| "we can't see it" | We seal it; the deployment account holds the key. |
| "secure" | Name the particular property instead. |
| "revoked", alone | Deletion ends our access, not Riot's credential. |
| "delivered", about an inbox | Report the provider's own status. |

Trace every claim to the code. Retention, retries and background state count.

## The map

```
src/
  router.ts           methods, origin checks, abuse gates, route table
  routes/             auth, store, inventory, preferences, email, stop, hook
  storage/            primary D1 SQL and atomic transactions
  vault/
    upstream.ts       egress allowlist; read this first
    http.ts           only outbound fetch
    keys.ts, seal.ts  keyed identifiers and purpose-bound encryption
    session.ts        sealed session and atomic alert flag
    qr.ts             generation-bound QR lifecycle via storage/scans.ts
    cache.ts          encrypted public DTOs, D1 revocation before reads
    evict.ts          cache namespaces and eviction, independent of session reads
    alerts.ts         fair batches, circuit breaker, invocation budget
  alerts/             OTP, send quotas, immutable outbox, bounded dispatch
  lib/                bounded bodies and private JSON responses
web/                  Preact, DOM, account generation, browser catalogue joins
migrations/           versioned upgrades; schema.sql is the fresh equivalent
test/                 unit, actual component fixtures, workerd + real D1
public/               shell and self-hosted assets; app.js/css are build outputs
```

Riot hostnames stay in `src/vault/`. Module names are lowercase and one word.

## Running it

```sh
npm ci
npm run fonts
npm run art
npm run dev
npm run check
npm run deploy
npm run deploy:live
```

Deploy scripts apply versioned D1 migrations before the Worker. Use the live
environment deliberately. Production secrets never belong in tracked files,
command arguments or logs. Resend's Worker key has sending access for the
verified sending domain, not administration access.

For a phone, use `npm run phone` and `npm run dev`. Tailscale serves HTTPS
while Wrangler stays on 127.0.0.1. **Never Tailscale Funnel.** Do not run
storage tests while the dev Worker is using the same local database.

The live kill switch is `npx wrangler secret put JAR_KEY --env live`.

## Commits

Conventional prefixes, lowercase subjects written as claims. Explain material
behavior changes, measured evidence and tradeoffs in the body.

Author: `NicolasV7 <159790870+NicolasV7@users.noreply.github.com>`.
**Never add an AI co-author trailer.**

`git checkout legacy-operator-terminal` is the app before the artboard rewrite.
