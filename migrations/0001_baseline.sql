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
