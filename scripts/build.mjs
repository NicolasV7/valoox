// web/ → public/app.js and public/app.css.
//
// One bundle, no code splitting, no chunk names. The whole app is a few tens of
// kilobytes and a second request costs more than it saves on a phone that is
// opening this for ten seconds.
//
//   node scripts/build.mjs          once
//   node scripts/build.mjs --watch  and keep going

import { execFileSync } from 'node:child_process';
import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');
const dev = watch || process.argv.includes('--dev');

/**
 * The commit this bundle is made of, stamped in so the page can print it.
 *
 * GITHUB_SHA first: on a CI build that is the commit GitHub itself checked
 * out, and it is right even in a detached or shallow checkout where the local
 * git would answer about something else.
 *
 * Everything here fails soft. A build outside a checkout — a tarball, a
 * container with no git — still has to produce a bundle, so an unknown sha is
 * a value and not an error. The screen knows what to do with it.
 */
function stamp() {
  const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    const sha = process.env.GITHUB_SHA || git('rev-parse', 'HEAD');
    // Uncommitted work means the hash below does not hold what is being
    // built, and saying so is the whole point of printing one.
    const dirty = !process.env.GITHUB_SHA && git('status', '--porcelain') !== '';
    return { sha, dirty, at: git('log', '-1', '--format=%cI') };
  } catch {
    return { sha: 'unknown', dirty: false, at: '' };
  }
}

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['web/main.tsx'],
  bundle: true,
  outfile: 'public/app.js',
  format: 'esm',
  target: ['es2022'],
  platform: 'browser',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  // The CSS comes out beside it, named after the entry: public/app.css.
  //
  // The font urls are absolute paths the Worker serves at runtime, not assets
  // to resolve now — `npm run fonts` puts them there and git never sees them.
  // Without this esbuild tries to read them off disk at build time and fails on
  // a clean checkout, which is the one machine that must work.
  external: ['/fonts/*'],
  minify: !dev,
  sourcemap: dev ? 'inline' : false,
  legalComments: 'none',
  // Nothing in here may reach for a Node built-in. If one appears, the import
  // is wrong rather than something to polyfill.
  conditions: ['browser'],
  // Read by web/built.ts, which is the only thing allowed to look at it.
  define: { __BUILD__: JSON.stringify(stamp()) },
  logLevel: 'info',
  metafile: !dev,
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching web/');
} else {
  const result = await build(options);
  if (result.metafile) {
    const bytes = Object.values(result.metafile.outputs).reduce((n, o) => n + o.bytes, 0);
    console.log('bundle ' + (bytes / 1024).toFixed(1) + ' KB');
  }
}
