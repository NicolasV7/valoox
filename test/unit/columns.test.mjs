import { expect, test } from 'vitest';
import { additions } from '../../scripts/columns.mjs';

test('the deploy preflight upgrades old columns without altering existing values', () => {
  expect(additions([])).toEqual([]);
  expect(additions(['uid', 'kid', 'blob', 'ver', 'created_at', 'last_used'])).toEqual([
    'ALTER TABLE s ADD COLUMN alerts INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE s ADD COLUMN acct TEXT',
  ]);
  expect(additions(['uid', 'alerts'])).toEqual(['ALTER TABLE s ADD COLUMN acct TEXT']);
  expect(additions(['uid', 'alerts', 'acct'])).toEqual([]);
});
