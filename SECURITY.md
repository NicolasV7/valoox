# Security

valoox holds a Riot session on behalf of whoever signed in. That is the whole
risk surface, and it is why this file is specific rather than a form letter.

**Contact:** nicolas@delapava.dev — Spanish or English, whichever is easier.
Also published at
[`/.well-known/security.txt`](https://valoox.store/.well-known/security.txt).

Please report privately first. I will confirm I have read it, and I would
rather hear about something that turns out to be nothing than not hear about
it.

## What this is

One Cloudflare Worker on the free plan, at `valoox.store`. It signs you in
through Riot Mobile's QR flow, reads your store and your collection, and
emails you when something you starred turns up. The source is this repository
and the deployed browser bundle names the commit it was built from — see
**Verifying what is running**, below.

## What I most want to hear about

In order:

1. **Any way to read another user's session.** The session is sealed with
   AES-256-GCM under a key derived per browser (HKDF, `info = "jar:" + uid`),
   with `kid|uid` as additional data so a row moved into another row's place
   fails to open. The key lives in the Worker's secrets, never in D1. A way
   around any of that is the most serious thing here.

2. **Any way to make the Worker call a Riot endpoint that is not in
   [`src/vault/upstream.ts`](src/vault/upstream.ts).** Every outbound request
   in the repository goes through one function, which calls `assertAllowed`
   before it calls `fetch`. The list holds reads only: nothing that buys,
   equips, queues, parties or chats is on it, which is what makes "read-only"
   a thing you can check rather than a thing I say.

3. **XSS on the origin.** The page can reach a session that skipped 2FA.
   The CSP is `default-src 'none'` with `script-src 'self'` and no
   `unsafe-inline`; the page builds DOM and never HTML from strings, and
   colours are set through CSSOM rather than a `style` attribute, because item
   names come from a community catalogue this project does not control.

4. **Anything that writes the puuid, the access token, the sealed jar, or a
   URL containing one, to a log.** `[observability] enabled = false` in
   `wrangler.toml` is part of this and not a tuning choice: the storefront
   path carries the puuid, and Workers Logs would persist it.

5. **Anything that lets one account's alert mail reach another address,** or
   lets an address be marked verified without the six digits being typed back.

## What is already known, and is not a finding

- **One database row exists per browser,** holding the sealed session, the
  starred list and the email address. The site says so. "Zero data stored" is
  not a claim this project makes and never has been.
- **Disconnecting deletes this project's copy of the session.** It does not
  revoke anything at Riot: that session lives until Riot expires it. The copy
  says exactly this, deliberately.
- **The daily job polls Riot once per account per day** at 00:30 UTC, with a
  circuit breaker that stops the run if more than half the calls fail.
- **Names, renders and clips are fetched by the browser from
  `valorant-api.com`,** a community catalogue. It is the only third party the
  page talks to, it never sees a token, and the three hostnames involved are
  each pinned to one CSP directive.
- **Rate limiting is Cloudflare's, not mine.** The free plan's defaults are
  what is in front of this.

Please do not run load tests, automated scanners or anything that would
degrade the service for people using it. There is one Worker and a free-plan
quota behind it.

## Verifying what is running

The account screen prints the commit the page was built from and links to it.
That tells you where the code came from, as asserted by the machine that built
it — it does not tell you who deployed it.

When a deploy runs from CI
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) the browser
bundle is attested with Sigstore, and then it is checkable without trusting
me:

```sh
curl -sO https://valoox.store/app.js
gh attestation verify app.js --repo NicolasV7/valoox
```

That covers the browser half only. Cloudflare publishes no hash of the Worker
bundle it is running, so there is no way from outside to confirm the Worker
answering a request is built from this commit. If you know of one, that is
also something I want to hear about.

## The kill switch

Rotating `JAR_KEY` makes every stored session undecryptable at once and signs
everybody out. It is one command and it takes effect immediately, because
nothing caches a key across a rotation:

```sh
npx wrangler secret put JAR_KEY
```

If a report is serious enough to need it, that is what happens first.

## Scope

In scope: `valoox.store`, `drop.valoox.store`, and this repository.

Out of scope: Riot Games' own systems and anything at `riotgames.com` —
valoox is not affiliated with Riot, and a bug in their API is theirs. Also out
of scope: `valorant-api.com`, which is somebody else's community project.

There is no bounty. This is one person's side project, paid for out of
pocket. What I can offer is a fast reply, a fix, and credit in the commit if
you want it.
