# Security

valoox holds a Riot session for the person who approved it in Riot Mobile.
The deployment account can access Worker secrets; this is not zero-knowledge.

Contact: nicolas@delapava.dev, in Spanish or English. The same contact is in
[security.txt](https://drop.valoox.store/.well-known/security.txt).
Please report privately first; there is no bounty.

## Boundaries

One Cloudflare Worker serves [drop.valoox.store](https://drop.valoox.store).
The apex redirects there. Game access passes the
[egress allowlist](src/vault/upstream.ts): nineteen rules and no purchases,
equipping, queueing or chat. Authentication writes are intentional. Redirects
cannot bypass the allowlist. Riot's undocumented storefront POST has not been
independently proven idempotent; do not infer that property from its method.

The browser's 256-bit `__Host-val` secret is never persisted. D1 keys are keyed
fingerprints, so a database or KV identifier cannot be replayed as the cookie.
Approval rotates the secret. Secure, HttpOnly, host-only and SameSite=Strict
attributes protect its placement. Writes and QR polls require same-origin
Fetch Metadata or an exact Origin fallback; absent metadata fails closed.

[Sealing](src/vault/seal.ts) uses AES-256-GCM, a fresh IV and HKDF. The browser
identifier, key version and purpose/schema bind both keys and authenticated
data. Sessions, QR scans, public store/inventory DTOs, stop links and outboxes
have separate purposes. Cache reads also validate their shape. `JAR_KEY` stays
outside D1 and KV. A storage dump reveals pseudonymous browser/account links
and security metadata, plus ciphertext; it does not authenticate a browser.

The Riot jar, puuid and bearer tokens never leave the vault in an API response.
Request logging is disabled. Error messages and stacks are not logged, since
they can contain an upstream credential URL. The page builds DOM, with
`script-src 'self'`, no inline script and no third-party script. The community
catalogue/artwork and Riot clips use separate, explicitly allowed CSP directives.

## Atomic state and retention

D1 primary reads decide whether a session exists. KV holds encrypted view
caches and the public client version, not credentials or security decisions.
A late cache deletion cannot restore access. Disconnect deletes the session
and pending scan in one transaction; best-effort cache cleanup cannot turn
confirmed revocation into a false failure.

A QR scan is encrypted in D1, generation-bound and exclusively leased. It has
an absolute ten-minute deadline. Replacing, expiring or cancelling it prevents
an in-flight poll from committing a new session. Login never reuses the old
credential or resets an existing writer's CAS version.
Short-lived aliases allow a logout already carrying the preceding cookie to
delete the newly approved session. These aliases never authorize API reads.
Legacy preferences are adopted only after a new QR confirms the same Riot account;
legacy cookies, jars, pending codes and stop links cannot authenticate.

OTP digests are keyed and bind browser, recipient and generation. One D1
transaction increments the attempt counter, consumes the matching proof and
writes verified mail with the alert flag. Five attempts in ten minutes is a
strict limit, including concurrent requests. Codes use unbiased random digits.
Send attempts have a sixty-second browser/recipient cooldown and five-per-hour
recipient/account quotas; failed attempts still count.

Stop links expire after thirty days and bind a mail generation. One answer
wins atomically; answering no also closes the link. A footer removes that
account/address across browsers while retaining their lists. A newer address
generation and unrelated accounts are unaffected.

Message mappings are reserved in D1 before sending and expire after a week.
Only signed Svix events within five minutes can change their current generation.
A webhook racing the send response cannot be silently discarded or regress a
later provider state. Unknown mappings are ignored; repeated CAS failures
return a retryable response.

Discord linking requires a signed private interaction and a separate successful bot
message. Codes contain over 120 random bits, expire after ten minutes, are stored
only as keyed digests, and can be claimed once. Session CAS, code consumption and
the opt-in index commit together. The index stores keyed recipient fingerprints;
Discord identities and conversation ids stay in the encrypted session and outbox.
`/stop` atomically disables every indexed browser and cancels claimed pending links.
Replayed interaction ids cannot undo a later reconnect or repeat a stop action.
Signatures bind the original request body and timestamp; events outside five minutes
are rejected. Discord events use their own signed endpoint, without a cookie-origin exemption elsewhere.

Sessions are pruned after ten days without a session write. Background alert
checks also write sessions, so closing the page does not start that deadline.
Session-linked security state cascades on deletion. Expired scans, codes,
limits, stop records, mappings and
delivery records and Discord connection codes are pruned by the scheduled job. D1 Time Travel retains
deleted ciphertext for the platform retention period; deletion is not physical
erasure. Rotating `JAR_KEY` also orphans that old ciphertext.

## Abuse and background work

Browser rotation recovery makes at most eight unsuccessful automatic attempts
before requiring manual recovery. Missing bundle metadata gets six catalogue
attempts per mount/id. Email-code status polling is serial, pauses while hidden
or offline, and stops at code expiry. QR polling also stops locally after ten
minutes and cannot restart after its component unmounts.

A coarse edge limit runs before application work. Atomic D1 gates additionally
bound QR starts by browser/IP and outgoing mail by account/recipient. Supported
methods are explicit. JSON bodies are bounded at 64 KiB, with 4 KiB limits for
mail and stop actions; webhook bodies are bounded before signature verification.
Anonymous preference writes authenticate before parsing.

After 00:30 UTC, cron runs fair batches every fifteen minutes. Invalid opt-in
flags are repaired, and checked timestamps advance independently of session
activity. Browser watchlists are combined for the same account/destination.
Typed accessory ids participate in matching.

Each invocation counts every external attempt, including timeouts and mail
retries, against a 48-request budget. One daily delivery is reserved atomically
per account/destination. An encrypted immutable outbox retries independently of
Riot polling and stops at the payload's expiry, within the storefront rotation.
Resend idempotency keys accompany identical retry bodies. An API
acceptance or a provider event is not evidence someone received or read a mail.

Discord sends through the same invocation budget. Retries reuse immutable content
and a nonce, honor shared provider cooldowns, and stop after four HTTP attempts
or payload expiry. A permanent private-message refusal pauses that Discord
connection without disabling email. Discord's nonce deduplication covers only a
few minutes, so an ambiguous timeout followed by a delayed retry may duplicate
a message. An already in-flight send may complete after disconnection.

## Review regression evidence

The 2026-10-12 review added executable regressions rather than live attack traffic:

| Vector | Evidence |
| --- | --- |
| Storage-id cookie replay; session-to-cache transplant; delayed KV logout | [isolation tests](test/workers/isolation.test.ts) |
| QR cancellation, fixed expiry, exclusive lease, credential rotation | [scan tests](test/workers/scans.test.ts) |
| Legacy preference transfer to another Riot account | [adoption tests](test/workers/adoption.test.ts) |
| Concurrent OTP guesses, replay, address changes, lost reservation CAS | [code tests](test/workers/codes.test.ts) |
| Concurrent stop answers, old generations, expiry, account isolation | [stop tests](test/workers/stops.test.ts) |
| Origin bypass, unsupported verbs, body/anonymous QR abuse | [request tests](test/workers/requests.test.ts) |
| Cross-account UI caches, late responses, false logout confirmation | [component tests](test/unit/ui.test.mjs), [private state tests](test/unit/private.test.ts) |
| Cron starvation, combined lists, retry budget and immutable payloads | [cron tests](test/workers/cron.test.ts) |
| Old-schema upgrades and schema/migration equivalence | [migration tests](test/unit/migrations.test.ts) |

No production Riot jar was decrypted for these tests; external calls are fixtures.

## Deployment and secrets

Deployment applies versioned migrations before shipping. The portable defaults
use placeholder storage ids; live storage is named explicitly under `env.live`.
The Worker Resend key is sending-only for its verified domain, not an admin key.
Keys and webhook signing secrets exposed in private development history must
be rotated at the provider and updated through stdin, never committed or logged.

CI runs the same `npm run check` as local work. Automated deployment additionally
requires a scoped Cloudflare token and account id in GitHub Secrets. The current
Wrangler OAuth can deploy but cannot create that token. Until the repository
secrets are supplied, the deploy workflow explicitly skips deployment.
Do not replace a scoped CI token with a personal OAuth refresh credential.

The browser bundle records its source commit. A successful CI deploy attests
`public/app.js` with Sigstore; a manual deployment has no CI attestation:

```sh
curl -sO https://drop.valoox.store/app.js
gh attestation verify app.js --repo NicolasV7/valoox
```

This covers the browser artifact only. Cloudflare publishes no externally
verifiable hash of the executing Worker, so do not claim that proof.

The live kill switch is `npx wrangler secret put JAR_KEY --env live`.
It invalidates browser lookups, sessions, caches, QR scans and outstanding links.

## Scope

This repository, valoox.store and drop.valoox.store are in scope. Riot's own
systems and the community catalogue are not. Do not run load tests or degrade
the shared free-plan service.
