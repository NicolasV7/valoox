// Normalize pre-migration installations using column metadata only, then let
// Wrangler record each version. No session or credential values are selected.
import { execFileSync } from 'node:child_process';
import { additions } from './columns.mjs';

const live = process.argv.includes('--live');
const remote = !process.argv.includes('--local');
const args = ['wrangler', 'd1', 'execute', 'DB', remote ? '--remote' : '--local'];
if (live) args.push('--env', 'live');
function run(parts, capture = false) {
  return execFileSync(
    process.execPath,
    ['node_modules/wrangler/bin/wrangler.js', ...parts.slice(1)],
    {
      env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
      encoding: 'utf8',
    },
  );
}
const info = JSON.parse(run([...args, '--command=PRAGMA table_info(s)', '--json'], true));
const columns = info.flatMap((r) => r.results ?? []).map((r) => r.name);
for (const statement of additions(columns)) {
  run([...args, '--command=' + statement, '-y']);
}
const migrate = ['wrangler', 'd1', 'migrations', 'apply', 'DB', remote ? '--remote' : '--local'];
if (live) migrate.push('--env', 'live');
run(migrate);
