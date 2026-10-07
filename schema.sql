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
  last_used  INTEGER NOT NULL
);

-- Plaintext flag so the cron can find the rows to poll with one indexed query.
-- It reveals only "this browser wants alerts" — the wishlist and the ntfy topic
-- live INSIDE the sealed blob, because a topic is a capability to message you.
ALTER TABLE s ADD COLUMN alerts INTEGER NOT NULL DEFAULT 0;
