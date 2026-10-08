// Whether two spellings reach the same inbox.
//
// It exists because of one screen and one decision on it: the send button
// appears when the address in the field is no longer the address on the row.
// Comparing the raw strings got that wrong the moment somebody typed a `+`,
// which swapped the button for an address that had not changed yet and would
// not have changed when they finished either.
//
// Deliberately narrow. Two foldings and both are facts rather than guesses:
//
//   - case and surrounding space. No provider in use treats a local part as
//     case-sensitive, whatever the RFC permits.
//   - Google's own routing. gmail.com ignores dots in the local part and
//     everything from a `+` onward, and googlemail.com is the same mailbox.
//     Published behaviour, scoped to those two hosts, so it cannot misfire
//     on a provider that treats either character literally.
//
// Plus a `+` with nothing after it, on any host: an empty tag is nobody's
// address, it is somebody half way through typing one.
//
// What this never touches is what gets stored or sent. The address goes to
// the provider exactly as it was typed — folding it for delivery would be
// deciding on somebody's behalf which of their mailboxes they meant.
//
// src/alerts/claim.ts keys the one-mailbox-per-account hold on the raw
// address, so aliases of one inbox can still hold two rows. That is a
// separate thing and this is not it.

const GOOGLE = new Set(['gmail.com', 'googlemail.com']);

export function fold(raw: string): string {
  const flat = raw.trim().toLowerCase();
  const at = flat.lastIndexOf('@');
  if (at <= 0) return flat;

  let user = flat.slice(0, at);
  const host = flat.slice(at + 1);

  // Half a tag is no tag.
  if (user.endsWith('+')) user = user.slice(0, -1);

  if (GOOGLE.has(host)) {
    return user.split('+')[0].replace(/\./g, '') + '@gmail.com';
  }
  return user + '@' + host;
}

export const sameMailbox = (a: string | undefined, b: string | undefined): boolean =>
  !!a && !!b && fold(a) === fold(b);
