# The boards

The design is 122 artboards in a Design canvas, 61 dark and the same 61 again in
light. They are the specification: a screen is finished when it matches its
board at 390px.

**[Open the canvas](https://claude.ai/artifact/JdhyhhmhsdoEtc9UxFLYYB)** — the
HTML is deliberately not in this repo. It carries `/_blob/` references that only
resolve inside the artifact, and the rules that survive without it are written
out in `DESIGN.md`.

Every board has a light twin named `Light<Name>`; this index lists the dark set.
Sizes are the artboard's, in CSS pixels.

## Getting in

| Board | Screen | Size |
| --- | --- | --- |
| `Gate` | 1 · Sign in | 390×844 |
| `Qr` | 2 · Scan | 390×844 |
| `QrWaiting` | 3 · Approved | 390×844 |
| `QrExpired` | 4 · Expired | 390×844 |

## Store

| Board | Screen | Size |
| --- | --- | --- |
| `Loading` | Loading | 390×844 |
| `Main` | Store · full scroll | 390×1600 |
| `OfferLoading` | Offer or piece, loading | 390×920 |
| `Offer` | Offer, opened | 390×844 |
| `BundleLoading` | Bundle, loading | 390×1398 |
| `Bundle` | Bundle, opened | 390×1398 |
| `BundleItem` | One piece of it | 390×844 |
| `BundleCard` | Card, from the bundle | 390×1010 |
| `BundleSpray` | Spray, from the bundle | 390×844 |
| `BundleBuddy` | Charm, from the bundle | 390×844 |
| `Buddy` | Buddy, on a gun | 390×844 |
| `Title` | Title, which has no art | 390×844 |
| `Card` | Card, opened | 390×1010 |
| `Spray` | Spray, opened | 390×844 |

## Collection · weapons

| Board | Screen | Size |
| --- | --- | --- |
| `CollectionLoading` | Weapons, loading | 390×1925 |
| `Collection` | Weapons · every slot | 390×1925 |
| `VandalLoading` | Vandal, loading | 390×1800 |
| `Vandal` | Vandal · every skin | 390×1800 |
| `VariantsLoading` | Inspecting, loading | 390×950 |
| `Variants` | Reaver Vandal, opened | 390×950 |
| `MeleeLoading` | Melee, loading | 390×1130 |
| `Melee` | Melee · every skin | 390×1130 |
| `MeleeSkinLoading` | Inspecting a knife, loading | 390×1080 |
| `MeleeSkin` | Reaver Karambit, opened | 390×1080 |

## Collection · accessories

| Board | Screen | Size |
| --- | --- | --- |
| `SpraysLoading` | Sprays, loading | 390×760 |
| `Sprays` | Sprays | 390×760 |
| `SprayOpen` | Spray, opened | 390×760 |
| `BuddiesLoading` | Buddies, loading | 390×796 |
| `Buddies` | Buddies | 390×796 |
| `BuddyOpen` | Charm, opened | 390×796 |
| `CardsLoading` | Cards, loading | 390×985 |
| `Cards` | Cards | 390×985 |
| `CardOpen` | Card, opened | 390×985 |
| `TitlesLoading` | Titles, loading | 390×864 |
| `Titles` | Titles | 390×864 |
| `TitleOpen` | Title, opened | 390×864 |
| `AccessoryLoading` | Accessory, loading | 390×880 |
| `CollectionEmpty` | Nothing there | 390×844 |

## Alerts

| Board | Screen | Size |
| --- | --- | --- |
| `AlertsLoading` | Alerts, loading | 390×860 |
| `AlertsEmpty` | Alerts, first run | 390×860 |
| `AlertsChannel` | Where it goes | 390×860 |
| `AlertsOtp` | The code | 390×860 |
| `Alerts` | Alerts, working | 390×1060 |
| `AlertsSearch` | Adding to the list | 390×900 |
| `AlertsFailed` | Test refused | 390×860 |
| `MailOtp` | The code, in a mailbox | 600×900 |
| `MailAlert` | The alert, in a mailbox | 600×990 |
| `StopAsk` | Stop, the question | 390×844 |
| `StopDone` | Stop, done | 390×844 |
| `StopKept` | Stop, no | 390×844 |
| `StopUsed` | Stop, link spent | 390×844 |
| `StopBroken` | Stop, bad link | 390×844 |

## Account, and leaving

| Board | Screen | Size |
| --- | --- | --- |
| `Account` | Account | 390×1560 |
| `Disconnect` | Disconnect | 390×1110 |
| `Keep` | What we keep | 390×1120 |
| `Error` | Riot said no | 390×900 |

## valoox.store

| Board | Screen | Size |
| --- | --- | --- |
| `WebLanding` | valoox.store | 1280×3806 |
| `WebHow` | How it works | 1280×2596 |
| `WebData` | What we keep | 1280×2486 |
| `WebAlerts` | Alerts | 1280×2390 |

## Type, colour, parts

| Board | Screen | Size |
| --- | --- | --- |
| `System` | Design system | 1280×2360 |

## Standby

| Board | Screen | Size |
| --- | --- | --- |
| `StoreNight` | Night market + accessories | 390×844 |

