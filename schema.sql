-- One row per signed-in browser. Nothing here identifies a Riot account:
-- the puuid lives sealed inside `blob`, never as a column, so a raw table dump
-- reveals no Riot identity at all.
CREATE TABLE IF NOT EXISTS s (
  -- 16 random bytes, hex. Lives only in the browser's httpOnly cookie.
  uid        TEXT PRIMARY KEY,
  -- Key version. Lets a KEK rotate without logging anyone out.
  kid        INTEGER NOT NULL,
  -- base64(iv[12] || ciphertext || GCM tag[16]) of {jar, puuid, shard}.
  blob       TEXT NOT NULL,
  -- Compare-and-swap token. Two tabs refreshing at once must not clobber a
  -- rolled-forward jar: the loser re-reads instead of overwriting.
  ver        INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  -- Drives the prune of abandoned rows. Deliberately NOT indexed: indexing a
  -- column written on every request doubles D1 rows-written.
  last_used  INTEGER NOT NULL,
  -- Plaintext flag so the cron can find the rows to poll. It reveals only
  -- "this browser wants alerts" — the wishlist and the webhook live INSIDE the
  -- sealed blob, because a webhook is a capability to message you.
  --
  -- In the CREATE rather than behind an ALTER. SQLite has no
  -- `ADD COLUMN IF NOT EXISTS`, so the file vitest.config.ts calls the one
  -- source of truth for the schema could not be applied twice: the second run
  -- died on `duplicate column name: alerts`. The tests only survived it
  -- because setup.ts drops the table first.
  alerts     INTEGER NOT NULL DEFAULT 0,
  -- Which ACCOUNT this browser is, without saying which account that is:
  -- HMAC-SHA256 of the puuid under a key derived from JAR_KEY, truncated.
  -- It exists so COUNT(DISTINCT acct) is a real number — a row is a browser,
  -- and a phone, a laptop and every private window are separate rows.
  --
  -- The claim above still holds: the mark is not the puuid, does not contain
  -- it, and cannot be walked back without a key that is not in this database.
  -- What a dump DOES now show is that two rows are one account. Not which.
  acct       TEXT
);

-- The column the cron filters on, so listAlerting is an index scan rather than
-- a table scan. schema.sql claimed "one indexed query" and no index existed.
CREATE INDEX IF NOT EXISTS s_alerts ON s (alerts) WHERE alerts = 1;
