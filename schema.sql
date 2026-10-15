-- Existing encrypted sessions are preserved for account-confirmed QR adoption.
CREATE TABLE IF NOT EXISTS s (
  uid TEXT PRIMARY KEY,
  kid INTEGER NOT NULL,
  blob TEXT NOT NULL,
  ver INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_used INTEGER NOT NULL,
  alerts INTEGER NOT NULL DEFAULT 0,
  acct TEXT
);
CREATE INDEX IF NOT EXISTS s_alerts ON s(alerts) WHERE alerts=1;

-- Authoritative security state belongs in D1, never eventually consistent KV.
CREATE TABLE scans (
  uid TEXT PRIMARY KEY, id TEXT NOT NULL, kid INTEGER NOT NULL, blob TEXT NOT NULL,
  ver INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL, lease INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE families (
  uid TEXT NOT NULL, next TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY(uid,next)
);
CREATE TABLE otp (
  uid TEXT PRIMARY KEY REFERENCES s(uid) ON DELETE CASCADE,
  id TEXT NOT NULL UNIQUE, recipient TEXT NOT NULL, hash TEXT NOT NULL,
  expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0, claim TEXT
);
CREATE TABLE limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL);
CREATE TABLE messages (
  id TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES s(uid) ON DELETE CASCADE,
  gen TEXT NOT NULL, provider TEXT UNIQUE, expires INTEGER NOT NULL
);
CREATE TABLE stops (
  id TEXT PRIMARY KEY, uid TEXT NOT NULL REFERENCES s(uid) ON DELETE CASCADE,
  gen TEXT NOT NULL, expires INTEGER NOT NULL, spent INTEGER NOT NULL DEFAULT 0, claim TEXT
);
CREATE TABLE checks (
  uid TEXT PRIMARY KEY REFERENCES s(uid) ON DELETE CASCADE, checked INTEGER NOT NULL, rotation TEXT
);
CREATE TABLE deliveries (
  key TEXT PRIMARY KEY, state INTEGER NOT NULL DEFAULT 0,
  lease INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL, owner TEXT, blob TEXT NOT NULL
);
CREATE INDEX messages_expiry ON messages(expires);
CREATE INDEX scans_expiry ON scans(expires);
CREATE INDEX s_acct ON s(acct) WHERE acct IS NOT NULL;
-- Retain legacy preferences for account-confirmed QR adoption, without polling.
UPDATE s SET alerts=0 WHERE kid<>2;

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
