-- Classify outboxes without opening paused email deliveries on every cron.
ALTER TABLE deliveries ADD COLUMN channel TEXT CHECK(channel IN ('mail','discord'));
-- The connecting valoox page selects the language, independent of Discord's locale.
ALTER TABLE links ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';
