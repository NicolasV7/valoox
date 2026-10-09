// How many people have used this, as closely as this app can honestly answer.
//
//   npm run who          production
//   npm run who -- local the local D1
//
// There is no analytics in this project and there is not going to be: no
// beacon, no third party, and Workers Logs is off because the storefront path
// carries the puuid. So the only thing to count is the thing that already
// exists for its own reasons — one row per signed-in browser, in D1.
//
// WHAT THE NUMBER IS NOT, and this prints with it every time, because a number
// without its caveat is how a dashboard starts lying:
//
//   · a row is a BROWSER, not a person. A phone and a laptop are two rows, and
//     every private window is another one.
//   · rows unused for ten days are deleted (prune, in vault/repo.ts), so this
//     cannot see anybody who stopped coming. It is "signed in now", never
//     "has ever used it".
//   · it counts sign-ins, not visits. Somebody who opened the page, read it
//     and left without scanning is not here at all — nothing recorded them,
//     which is the point.
//
// For visits, Cloudflare's own request metrics are in the dashboard under
// Workers & Pages -> val -> Metrics. Those are aggregate counts with no URL
// and no identity in them, they are metered by Cloudflare rather than by us,
// and `[observability] enabled = false` does not hide them — that setting is
// about Workers LOGS, which persist method and URL, which is the part that
// would carry the puuid.

import { execSync } from 'node:child_process';

const SQL = `
  SELECT COUNT(DISTINCT acct)                                    AS accounts,
         COUNT(*)                                                AS browsers,
         SUM(alerts)                                             AS with_alerts,
         SUM(last_used > strftime('%s','now') -  86400)          AS seen_24h,
         SUM(last_used > strftime('%s','now') - 604800)          AS seen_7d,
         date(MIN(created_at),'unixepoch')                       AS first_ever,
         date(MAX(created_at),'unixepoch')                       AS newest
  FROM s`;

const BY_DAY = `
  SELECT date(created_at,'unixepoch') AS day, COUNT(*) AS n
  FROM s GROUP BY day ORDER BY day`;

const where = process.argv[2] === 'local' ? '--local' : '--remote';

function ask(sql) {
  // One line and one command string. Node warns about args alongside
  // `shell: true`, and a newline inside the quotes arrives at D1 as a literal
  // backslash-n, which it answers with `unrecognized token`. The sql is a
  // constant in this file — nothing here comes off a request.
  const flat = sql.replace(/\s+/g, ' ').trim();
  const out = execSync(`npx wrangler d1 execute val-sessions ${where} --json --command "${flat}"`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  // wrangler prints a banner before the json on some versions.
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

const [now] = ask(SQL);
const days = ask(BY_DAY);

const pad = (s, n) => String(s).padEnd(n);
console.log('');
console.log('  ' + pad('accounts', 16) + now.accounts);
console.log('  ' + pad('browsers', 16) + now.browsers);
console.log('  ' + pad('with alerts set', 16) + now.with_alerts);
console.log('  ' + pad('seen in 24h', 16) + now.seen_24h);
console.log('  ' + pad('seen in 7 days', 16) + now.seen_7d);
console.log('  ' + pad('first ever', 16) + now.first_ever);

console.log('\n  new browsers by day');
const most = Math.max(...days.map((d) => d.n), 1);
for (const d of days) {
  console.log('  ' + d.day + '  ' + '▌'.repeat(Math.ceil((d.n / most) * 24)) + ' ' + d.n);
}

console.log(`
  "accounts" is COUNT(DISTINCT acct), and acct is an HMAC of the Riot puuid
  under a key that is not in this database — so two browsers of one account
  collapse into one here without the table ever naming the account. "browsers"
  is the raw row count: a phone and a laptop are two, every private window is
  another. The gap between them is how much row-counting over-counted.

  Rows unused for ten days are deleted, so both are "signed in now" and never
  "has ever used it". Anyone who opened the page and left without scanning is
  not here — nothing recorded them. A row that signed in before this column
  existed carries no mark until its next request, and does not count yet.

  For visits rather than sign-ins: the Cloudflare dashboard, Workers & Pages ->
  val -> Metrics. Aggregate, no URL, no identity, and not the logs setting that
  is off.
`);
