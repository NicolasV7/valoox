// Renders the two messages to public/../ for a look. Not shipped; `npm run
// check` does not run it. node scripts/mailpreview.mjs <outdir>
import { writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const out = process.argv[2] ?? '.';
const bundled = await build({
  entryPoints: ['scripts/mailentry.ts'],
  bundle: true,
  format: 'esm',
  write: false,
  platform: 'neutral',
});
const mod = await import(
  'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')
);
for (const [name, make] of Object.entries(mod)) {
  writeFileSync(out + '/mail-' + name + '.html', make());
  console.log('wrote', out + '/mail-' + name + '.html');
}
