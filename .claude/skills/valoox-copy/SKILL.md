---
name: valoox-copy
description: The voice, the claims this product may not make, and how strings are stored so they can be translated. Load this before writing or changing any user-facing text, in the app, the emails or valoox.store.
---

# Writing for valoox

This app asks a stranger to scan a QR that signs into their game account. It
earns that by being checkable, and a sentence that cannot be traced to a line of
code costs more than it buys.

## What it may not say

| Never | Why |
| --- | --- |
| "zero-knowledge", "zero data stored" | Both are false. One row exists per browser. |
| "we can't see it", "no podemos verlo" | We seal it. That is a different, true sentence — say that one. |
| "secure", "seguro" | It describes nothing. Name the property: sealed, allowlisted, never logged. |
| "revoked" alone | Disconnecting deletes *our* access. Riot's session lives until it expires on its own, and people make security decisions on that word. |
| "delivered", about an email | A server cannot observe an inbox. Report the status the provider returned. |
| "military-grade", "bank-level", "enterprise" | Nothing here is any of those and the reader knows it. |

And one positive rule: **never imply Riot approves of this.** Their policy names
store tracking as an unapproved use. Every surface carries the disclaimer, and
the interface does not imitate VALORANT's brand identity.

## The voice

Plain, specific, and short. The product's own best line is the shape to copy:
*"One mail a day at most, and only when something on your list is actually in
front of you."* It states a limit, it is checkable, and it has no adjectives.

- Prefer a number to an adverb. "Ten minutes, five attempts", not "expires soon".
- Name the mechanism when it is the reassurance. "The sign-in happens inside
  Riot's own app" beats "we take your security seriously".
- Say what the thing cannot do. The strongest section on the site is four
  sentences that all start *It cannot*.
- An error says which of the two things happened, and what to do. "Riot ended
  the session" and "Riot changed something" are different screens.
- No exclamation marks. No "oops". No "we're sorry for the inconvenience".

Spanish is rioplatense second person — *tenés*, *marcá*, *pegala*. English is the
canvas copy, already written on the artboards; lift it rather than re-inventing.

## Where strings live

`web/i18n/`, split by screen, nothing else. `test/unit/strings.test.ts` fails the
build on a user-facing literal anywhere else.

```
web/i18n/
  index.ts          t() and the active locale
  es/store.ts       ← the source locale, and the one served
  es/…
  en/store.ts
  en/…
```

**Interpolation is a function.** This is the rule that makes the difference
between a file that can be translated and one that cannot:

```ts
// no — the sentence is split around a value and the order is frozen
'Quedan ' + n + ' ofertas'

// yes
restantes: (n: number) => `Quedan ${n} ofertas`,
```

The same applies to plurals. Do not write `n === 1 ? ' ítem' : ' ítems'` at the
call site; put the branch inside the string function, where a translator can
change it to a language with three plural forms.

Keys are named for what the string *is*, not where it sits: `wishlistFull`, not
`alertsScreenLine3`.

## The error strings the server returns

`src/` throws messages like `storefront 403` and `sealed blob did not open`.
Those are for the log and for a developer. **They must not be rendered to a
user.** The client maps a failure to one of its own strings in `web/i18n/`; if it
cannot tell which, it shows the generic one and the status code.

## Before you call it done

- Read it aloud. If it sounds like a terms-of-service page, cut half.
- Check every claim against a file. If you cannot name the file, cut the claim.
- Grep your new text for the table above.
- `npm run check`.
