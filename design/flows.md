# Approved Alerts and Account revision

The Art-led proposal supersedes the original Alerts and Account canvas boards.
Only these areas change visually. Both use dark mode, Bricolage Grotesque,
Azeret Mono for numbers, the existing type scale, and the shared 107° stage.
Artwork colour is measured by the existing algorithm and set through CSSOM.
No additional fonts, scripts, icon libraries or outbound hosts are introduced.
The later visual revision restores the original compact Alerts rows and the
Buy Me a Coffee button's own yellow, while keeping the surrounding design.
Alerts and Account omit the valoox masthead, including loading and subpages.
Discord setup uses a compact heading and two numbered actions: copy the message,
then open the bot chat to paste and send it. Keep 44px action targets and allow
error, recovery and enlarged-text states to scroll instead of clipping them.

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

## Daily store sharing

The approved dark preview exports the equipped banner, Riot ID and up to four
daily offers in portrait (1080×1920) or compact (1080×1350) PNG format. It keeps
the existing fonts and measured artwork colours, with `valoox.store` branding.
A tag toggle removes the Riot ID tag from both the PNG and its accessible name.
Its encrypted account choice follows devices, loads on each opening and blocks
sharing until confirmed. A failed load or save has an explicit retry. Closing
the dialog still lets an intentional save finish; account changes discard old responses.
Hiding the tag leaves only the player name in the banner, without a replacement subtitle.
The date and fixed expiry use UTC so a saved image never shows a stale countdown.
Portrait rows reserve separate text and artwork columns, so even a wide pistol
cannot touch its name or price. Compact keeps its stacked tile layout, balancing
weapon area within a common artwork slot without stretching or cropping renders.
Format and tag changes briefly reveal the newly prepared preview; the checkbox
also eases its checked state. Reduced-motion preferences flatten both effects.
The modal initially focuses its heading, leaving Back's ring for keyboard use.
Opening reveals the panel with a 220ms fade and slight upward movement; its
backdrop fades in over 180ms. Reduced motion disables both opening animations.
The entry does not delay focus, interactions, image preparation or closing.

Preparation shows a static grey skeleton at the final poster's aspect ratio,
with banner, identity and four offer slots in the selected layout. Brand, labels
and actions stay visible. A localized status remains available to screen readers.
The footer reserves its help-copy space so the preview keeps its size on completion.

The browser prepares a file before the user taps Share image. The PNG has rounded
corners from the existing radius tokens. Supported devices open their own native
share menu with only that PNG attached, without a title, caption or URL; apps and
recipients belong to that menu. Cancellation returns to the preview. Unsupported browsers
offer Save image, and a failed native share offers an explicit save action.

`web/share/` owns preparation, artwork, painting, account lifecycle and transport.
No upload, public image URL, server renderer or background job is introduced.
Only anonymous catalogue/artwork requests use the existing allowlisted hosts.
The preview uses a canvas without expanding the CSP. Wallet and session fields
are excluded. Closing, rotation, logout or expiry invalidates pending work and
clears generated canvases. Export artwork uses a stable anonymous cache variant
so a normal image previously loaded without CORS cannot poison canvas readback.
A known banner must load before a PNG is offered; missing item artwork has a
labelled retry. Absent prices remain unavailable rather than being invented as zero.

Mobile text fields use a shared 16px floor after component font declarations,
including Alert search and the Discord command textarea. Manual zoom stays available.
