import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';

const migrations = readdirSync('migrations')
  .sort()
  .map((p) => readFileSync('migrations/' + p, 'utf8'));
const tables = (db: DatabaseSync) =>
  db
    .prepare(
      "SELECT name,sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all();
test('the fresh schema is exactly the versioned migration sequence', () => {
  const fresh = new DatabaseSync(':memory:');
  const migrated = new DatabaseSync(':memory:');
  fresh.exec(readFileSync('schema.sql', 'utf8'));
  for (const migration of migrations) migrated.exec(migration);
  expect(tables(migrated)).toEqual(tables(fresh));
  fresh.close();
  migrated.close();
});
test('upgrading an old installation preserves ciphertext and disables old-cookie cron access', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(
    'CREATE TABLE s(uid TEXT PRIMARY KEY,kid INTEGER NOT NULL,blob TEXT NOT NULL,ver INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,last_used INTEGER NOT NULL)',
  );
  db.exec("INSERT INTO s VALUES('legacy',1,'old-ciphertext',7,0,0)");
  db.exec(
    'ALTER TABLE s ADD COLUMN alerts INTEGER NOT NULL DEFAULT 0; ALTER TABLE s ADD COLUMN acct TEXT',
  );
  for (const migration of migrations) db.exec(migration);
  expect(db.prepare('SELECT blob,ver,alerts FROM s').get()).toEqual({
    blob: 'old-ciphertext',
    ver: 7,
    alerts: 0,
  });
  expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  db.close();
});
