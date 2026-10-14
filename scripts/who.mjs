// Count retained current-version sessions, without selecting private identities.
// npm run who targets production; npm run who -- local targets local D1.
import { CURRENT_KID } from '../src/vault/seal.ts';
import { run } from './wrangler.mjs';

const local = process.argv[2] === 'local';
const args = ['d1', 'execute', 'DB', local ? '--local' : '--remote', '--json'];
if (!local) args.push('--env', 'live');

function ask(sql) {
  const flat = sql.replace(/\s+/g, ' ').trim();
  return JSON.parse(run([...args, '--command', flat], { capture: true })).flatMap(
    (reply) => reply.results ?? [],
  );
}

const [counts] = ask(`
  SELECT COUNT(DISTINCT CASE WHEN kid=${CURRENT_KID} THEN acct END) AS accounts,
         COUNT(CASE WHEN kid=${CURRENT_KID} THEN 1 END) AS browsers,
         COUNT(DISTINCT CASE WHEN kid=${CURRENT_KID} AND alerts=1 THEN acct END) AS alert_accounts,
         COUNT(DISTINCT CASE WHEN kid=${CURRENT_KID} AND last_used>=unixepoch('now')-86400
                            THEN acct END) AS updated_24h,
         COUNT(DISTINCT CASE WHEN kid=${CURRENT_KID} AND last_used>=unixepoch('now')-604800
                            THEN acct END) AS updated_7d,
         COUNT(CASE WHEN kid<>${CURRENT_KID} THEN 1 END) AS legacy_browsers,
         COUNT(CASE WHEN kid=${CURRENT_KID} AND acct IS NULL THEN 1 END) AS unmarked,
         date(MIN(CASE WHEN kid=${CURRENT_KID} THEN created_at END),'unixepoch') AS first_current
  FROM s`);
const days = ask(`
  SELECT date(created_at,'unixepoch') AS day, COUNT(*) AS n
  FROM s WHERE kid=${CURRENT_KID} GROUP BY day ORDER BY day`);

console.log('\n  ' + (local ? 'Local' : 'Production') + ' current-version session records');
for (const [label, value] of [
  ['accounts', counts.accounts],
  ['browsers', counts.browsers],
  ['alert accounts', counts.alert_accounts],
  ['updated in 24h', counts.updated_24h],
  ['updated in 7 days', counts.updated_7d],
  ['first retained', counts.first_current ?? 'none'],
  ['legacy browsers', counts.legacy_browsers],
  ['unmarked browsers', counts.unmarked],
]) {
  console.log('  ' + label.padEnd(20) + value);
}

console.log('\n  retained current browsers by creation day');
const most = Math.max(...days.map((day) => day.n), 1);
for (const day of days) {
  console.log('  ' + day.day + '  ' + '▌'.repeat(Math.ceil((day.n / most) * 24)) + ' ' + day.n);
}

console.log(`
  Accounts are distinct keyed Riot account marks among current-version rows.
  Browsers are stored sessions, including multiple devices for one account.
  Legacy browser rows cannot authenticate and are excluded from current counts.

  Updated means the session was written, including by the background alert job.
  It does not measure page visits, concurrent users or people. Rows without a
  session write for ten days are pruned; logout also removes a row. These are
  retained records, never a count of everyone who has used the site.

  Visitors who never scan a QR are not recorded. For aggregate request metrics,
  use Cloudflare -> Workers & Pages -> val -> Metrics. Workers Logs remain off.
`);
