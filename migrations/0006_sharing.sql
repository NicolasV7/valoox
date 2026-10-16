-- Account-wide sharing choices are sealed separately from Riot sessions.
CREATE TABLE sharing (
  acct TEXT PRIMARY KEY, kid INTEGER NOT NULL, blob TEXT NOT NULL
);
