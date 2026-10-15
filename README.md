![valoox — your VALORANT store without opening the game](design/banner.png)

# valoox

Your VALORANT daily store and collection, on your phone, without opening the
game. Sign in with Riot Mobile's QR flow; the app never asks for your password.

**[Open the app](https://drop.valoox.store)** · [Architecture](#architecture)
· [Security and limitations](SECURITY.md) · [Design](DESIGN.md)

## Features

- Daily offers, night market, bundles and accessories, with owned items marked.
- Store rotations refresh automatically when any countdown expires or when an
  expired tab becomes visible again. After eight unsuccessful automatic attempts,
  requests stop and manual retry remains available. Fresh data resumes the scheduler.
- Missing bundle metadata gets up to six catalogue attempts while visible and online.
  Reopening that screen starts another bounded attempt sequence.
- Weapon skins, variants, sprays, buddies, cards and titles in your collection.
- Known rewards are hidden from unowned catalogue lists; owned rewards remain visible.
- Dark Alerts and Account screens, including email removal and disconnect confirmations.
- Wishlist alerts by verified email, Discord DM, or both. Each destination has
  independent consent; Discord stays unavailable until the bot is configured.
  Batches run every fifteen
  minutes outside the first half hour of each UTC day. Lists are grouped by
  account and destination; email retries use Resend idempotency. Discord verifies
  a separate bot DM and stops after four delivery attempts or payload expiry.

One Cloudflare Worker serves a Preact app, with D1 for sessions and atomic state
and KV for encrypted views. Riot sessions use purpose-bound AES-256-GCM keys;
D1 checks authentication and revocation before private cache reads. Every
outbound request passes the [19-rule allowlist](src/vault/upstream.ts), which
excludes purchases, equipping and chat. The browser joins the community
catalogue; code, fonts and fixed artwork are served from the app's own origin.
Catalogue data, item artwork and clips use narrowly allowed external hosts.

English is the source and fallback language. A Spanish browser preference selects
the Spanish translation, including emails requested from that tab.

## Architecture

```mermaid
flowchart LR
  B["Browser<br/>Preact + host-only cookie"]
  C["Community catalogue<br/>valorant-api.com"]
  R["Riot<br/>QR sign-in + account reads"]
  N["Resend<br/>Verified email alerts"]
  Q["Discord bot<br/>Opted-in private alerts"]

  subgraph CF["Cloudflare"]
    W["Worker<br/>API + scheduled jobs"]
    D[("D1<br/>Encrypted sessions + atomic state")]
    K[("KV<br/>Encrypted views")]
    A["Egress allowlist<br/>19 rules"]
    T["Cron<br/>Every 15 minutes"]
  end

  B -->|Same-origin API| W
  B -->|Client-side catalogue joins| C
  W -->|Session checks + state| D
  W -->|Private cached views| K
  T -->|Alert batches| W
  W -->|All outbound requests| A
  A -->|Authentication + reads| R
  A -->|Notifications| N
  A -->|Bot messages| Q
  Q -->|Signed private commands| W
```

Email and Discord connect independently; shared wishlist checks do not poll Riot twice.
D1 authorizes private cache reads. Sessions and views are encrypted by the Worker
with purpose-bound keys derived from `JAR_KEY`, which stays outside the databases.
[Open the interactive architecture](docs/architecture.html) for source links
and the detailed session flow.

## Local development

Use Node 24 or newer. Copy [.dev.vars.example](.dev.vars.example) to `.dev.vars`
and fill in `JAR_KEY` with 32 random bytes encoded as base64. Both alert transports are optional.

```sh
npm ci
npm run fonts
npm run art
npm run migrate -- --local
npm run dev
```

`npm run check` runs type checks, lint, tests and the browser build.
Source contracts require fewer than 200 lines per authored file and reject runtime
module cycles. Generated bundles, the Archify export/model and measured palette
data are excluded. Application code, scripts, tests and configuration are covered.
Email-code status checks stop at expiry and pause while hidden or offline. QR
polling stops on approval, expiry, unmount, or ten minutes of unsuccessful reads.
CI checks stop after ten minutes; deployments stop after twenty minutes.

`npm run who` reads aggregate current-version session counts from live D1;
`npm run who -- local` uses local D1. Session writes, including background alerts,
are reported as updates, not page visits. Legacy rows are listed separately.
`npm run phone` serves local development over Tailscale HTTPS;
`npm run phone:off` removes it. Keep the connection private; never use Funnel.

## Deploy your own copy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/NicolasV7/valoox)

The button provisions resources in your own account. For manual setup, create
the bindings below and replace the default placeholder IDs in `wrangler.toml`:

```sh
npx wrangler d1 create val-sessions
npx wrangler kv namespace create VAL
npx wrangler secret put JAR_KEY
npm run deploy
```

The default environment uses a separate Worker on `workers.dev`. Both deploy
scripts apply versioned D1 migrations before publishing. `npm run deploy:live`
targets this project's `val` Worker and custom domains; use it only with the
corresponding account, bindings and secrets.

| Worker setting | Purpose |
| --- | --- |
| `JAR_KEY` | Required secret: 32 random bytes, base64. Rotation invalidates existing sessions and encrypted state. |
| `RESEND_KEY` | Optional sending-only API key restricted to your verified sending domain. |
| `RESEND_HOOK` | Webhook signing secret required to accept Resend delivery events. |
| `MAIL_FROM` | Plain variable: a sender address on your verified domain. Change it for your own deployment. |
| `DISCORD_APP_ID` | Optional Discord Application ID; stored as a Worker secret to preserve deployment settings. |
| `DISCORD_PUBLIC_KEY` | Discord Ed25519 verification key, stored with Worker secrets. Public, but must match the application. |
| `DISCORD_TOKEN` | Optional bot token; required with both settings above to enable Discord linking. |

### Email with Resend

1. [Verify your sending domain](https://resend.com/docs/dashboard/domains/introduction)
   and set `MAIL_FROM` to an address on it.
2. Create a [sending-only API key](https://resend.com/docs/api-reference/api-keys/create-api-key)
   restricted to that domain; save it as the Worker's `RESEND_KEY` secret.
3. Add `https://<your-app-host>/api/hook/resend` as a
   [Resend webhook](https://resend.com/docs/webhooks/introduction). Subscribe to
   email events and save its signing secret as `RESEND_HOOK`.
4. In the app, open Alerts and verify the recipient address with the emailed code.

Use `npx wrangler secret put <NAME>` for your own default deployment, or append
`--env live` for this project's production environment. Worker secrets belong
in Cloudflare; local equivalents belong in the ignored `.dev.vars` file.

### Discord private alerts

1. Create a bot application in [Discord Developer Portal](https://discord.com/developers/applications).
   Enable User Install and Guild Install. For User Install, enable `applications.commands`;
   for Guild Install, enable `bot` and `applications.commands`. No privileged intents are needed.
2. Copy Application ID and Public Key from General Information and the token from Bot.
   Save them as `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY` and `DISCORD_TOKEN` using
   `npx wrangler secret put <NAME> --env live`. Keep local equivalents in `.dev.vars`.
3. Set the Interactions Endpoint URL to `https://<your-app-host>/api/hook/discord`.
   Run `npm run discord:check`, then `npm run discord:register` with matching local settings.
4. In Alerts, choose Discord, install the app, open its DM and generate a code.
   Send `/connect code:<code>` there within ten minutes. A separate bot message must
   succeed before the connection becomes active. `/status` checks it; `/stop`
   disables Discord alerts across all linked browsers. Browser removal affects only that browser.

Only direct messages are supported; arbitrary Discord webhooks and server channels
cannot be configured. Verify delayed proactive DMs with your installation before
advertising a server-free flow. If Discord denies a DM, linking stays inactive;
an existing connection is paused on a later permanent refusal. Email remains independent.
Discord nonce deduplication lasts only a few minutes; after a lost HTTP response,
a delayed retry can duplicate a message. We do not claim exactly-once delivery.

### GitHub Actions

Add repository Actions secrets named `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. The token needs access to deploy Workers, use the configured
KV binding, apply D1 migrations and manage the configured zone's Workers routes.
Scope it to the deployment account and zone.

The [Deploy workflow](.github/workflows/deploy.yml) runs on pushes to `main` or
manual dispatch. It skips deployment when the token is absent. Successful runs
check the code, attest `public/app.js`, apply live migrations and deploy.
The Account screen links to the browser build's source commit. Verify a CI-built
browser bundle with:

```sh
curl -sO https://drop.valoox.store/app.js
gh attestation verify app.js --repo NicolasV7/valoox
```

The attestation covers the browser bundle. It does not attest the running Worker.
Disconnecting removes this app's access; it does not revoke Riot's session or
erase Cloudflare backup history. See [SECURITY.md](SECURITY.md) for retention and
the remaining limits.

## License and artwork

[AGPL-3.0](LICENSE). See [PRODUCT.md](PRODUCT.md) for project identity and fork
guidance. Not affiliated with Riot Games. VALORANT and its artwork, including
the banner's sprays, belong to Riot Games, Inc.

The banner source is [design/banner.html](design/banner.html). After fetching
fonts and artwork, `npm run banner` renders its PNG using local Chrome or Edge.
