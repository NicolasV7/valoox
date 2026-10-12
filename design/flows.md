# Approved Alerts and Account revision

The Art-led proposal supersedes the original Alerts and Account canvas boards.
Only these areas change visually. Both use dark mode, Bricolage Grotesque,
Azeret Mono for numbers, the existing type scale, and the shared 107° stage.
Artwork colour is measured by the existing algorithm and set through CSSOM.
No additional fonts, scripts, icon libraries or outbound hosts are introduced.
The later visual revision restores the original compact Alerts rows and the
Buy Me a Coffee button's own yellow, while keeping the surrounding design.

## Alerts

| State | Implementation |
| --- | --- |
| Saved settings pending or failed | `web/screens/Alerts.loading.tsx` |
| No favourites | `web/screens/Alerts.first.tsx` |
| Watching weapons and accessories | `web/screens/Alerts.working.tsx` |
| Unverified destination | `web/screens/Alerts.standby.tsx` |
| Email entry, existing address, cooldown or failed request | `web/screens/Alerts.channel.tsx` |
| Code entry, expiry, spent attempts, cooldown or failed request | `web/screens/Alerts.code.tsx` |
| Provider refusal, bounce or suppression | `web/screens/Alerts.failed.tsx` |
| Catalogue search, loading, no matches or full list | `web/screens/Alerts.search.tsx` |
| Email removal confirmation and saved favourites | `web/screens/Alerts.remove.tsx` |

Counts and addresses come from saved preferences, never from demonstration data.
Weapons retain the daily clock; accessories use their own clock when present.
Both clocks account for the store view's fetch time. A list can be built before
email verification, but the Worker sends alerts only to a verified destination.
Removing email uses the existing same-origin `/api/stop` endpoint and retains
the list. Failed requests stay actionable and cannot claim success.

## Account

| State | Implementation |
| --- | --- |
| Identity, setup, privacy and leaving | `web/screens/Account.tsx` |
| Cold-link authentication loading | `web/screens/Initial.loading.tsx`, `web/screens/Account.loading.tsx` |
| Equipped card, missing artwork, region and last use | `web/screens/Account.profile.tsx` |
| Source, allowlist and browser build provenance | `web/screens/Account.build.tsx` |
| Optional support link | `web/screens/Account.coffee.tsx` |
| Stored data and excluded data | `web/screens/Account.keep.tsx` |
| Disconnect confirmation and failure | `web/screens/Account.leave.tsx` |
| Riot expiry or confirmed disconnect | `web/screens/Account.gone.tsx` |

Preferences may load independently of known identity and static privacy copy.
A failed logout preserves the current account. Confirmed logout clears private
browser state; Riot's credential expires separately. Ended-session screens
scroll normally so reconnect controls remain reachable on short phones.

The design uses typography and new Riot sprays in place of decorative icon
boxes. Stars, chevrons and search retain their existing functional glyphs.
Fresh fixed artwork lives in `web/design/flows.ts`; Riot asset paths are pinned
in `scripts/artwork.mjs` and fetched into ignored `public/art/` at deployment.

## Catalogue availability

Weapon skins, sprays, buddies, cards, titles and alert search exclude unowned
items ruled out by contract rewards or catalogue ownership flags. Rewards
already owned remain visible in the collection, including equipped items.
Skin and buddy matching checks their parent and level identifiers. Filtering
precedes search, counts and pagination; it does not delete existing favourites.

This evidence cannot predict when an eligible item will appear. If a catalogue
source fails, known flags still apply and the app remains browsable with the
evidence it has. These rules override the earlier disabled-star presentation.
