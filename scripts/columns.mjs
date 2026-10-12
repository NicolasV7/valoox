// Upgrade the unversioned schemas that preceded Wrangler migrations.
export function additions(columns) {
  if (!columns.length) return [];
  return [
    ['alerts', 'INTEGER NOT NULL DEFAULT 0'],
    ['acct', 'TEXT'],
  ]
    .filter(([name]) => !columns.includes(name))
    .map(([name, definition]) => 'ALTER TABLE s ADD COLUMN ' + name + ' ' + definition);
}
