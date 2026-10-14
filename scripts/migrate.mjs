// Normalize pre-migration installations using column metadata only, then let
// Wrangler record each version. No session or credential values are selected.
import { additions } from './columns.mjs';
import { run } from './wrangler.mjs';

const live = process.argv.includes('--live');
const remote = !process.argv.includes('--local');
const args = ['d1', 'execute', 'DB', remote ? '--remote' : '--local'];
if (live) args.push('--env', 'live');
const info = JSON.parse(
  run([...args, '--command=PRAGMA table_info(s)', '--json'], { capture: true }),
);
const columns = info.flatMap((r) => r.results ?? []).map((r) => r.name);
for (const statement of additions(columns)) {
  run([...args, '--command=' + statement, '-y']);
}
const migrate = ['d1', 'migrations', 'apply', 'DB', remote ? '--remote' : '--local'];
if (live) migrate.push('--env', 'live');
run(migrate);
