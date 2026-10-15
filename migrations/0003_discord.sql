-- Discord identities stay sealed; only keyed recipient fingerprints are indexed.
CREATE TABLE discord (
  uid TEXT PRIMARY KEY REFERENCES s(uid) ON DELETE CASCADE,
  recipient TEXT NOT NULL, gen TEXT NOT NULL, state TEXT NOT NULL
);
CREATE INDEX discord_recipient ON discord(recipient);
CREATE TABLE links (
  uid TEXT PRIMARY KEY REFERENCES s(uid) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE, gen TEXT NOT NULL, kid INTEGER NOT NULL,
  expires INTEGER NOT NULL, claim TEXT, recipient TEXT,
  state TEXT NOT NULL DEFAULT 'waiting'
);
CREATE INDEX links_expiry ON links(expires);
