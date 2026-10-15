-- Share encrypted favourites by verified Riot account; notification consent stays per browser.
ALTER TABLE s ADD COLUMN receiving INTEGER NOT NULL DEFAULT 0;
-- Legacy sealed consent is checked before any external request and corrected on first read.
UPDATE s SET receiving=1 WHERE kid=2;
CREATE TABLE wishlists (
  acct TEXT PRIMARY KEY, kid INTEGER NOT NULL, blob TEXT NOT NULL,
  ver INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL
);
ALTER TABLE discord ADD COLUMN since INTEGER NOT NULL DEFAULT 0;
DELETE FROM links WHERE uid IN (SELECT uid FROM discord WHERE state='connected');
