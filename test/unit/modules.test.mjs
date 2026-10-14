import { build } from 'esbuild';
import { expect, test } from 'vitest';
import { sources } from '../sources.ts';

test('authored modules have no runtime dependency cycles or storage imports from the vault', async () => {
  const entryPoints = ['src', 'web', 'scripts', 'test']
    .flatMap((root) => sources(root, /\.(?:[cm]?[jt]sx?)$/))
    .map((source) => source.path)
    .filter((path) => !path.endsWith('.d.ts'));
  const { metafile } = await build({
    entryPoints,
    bundle: true,
    write: false,
    outdir: 'work/review-build',
    metafile: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    external: ['/fonts/*'],
    logLevel: 'silent',
  });
  const graph = new Map(
    Object.entries(metafile.inputs)
      .filter(([path]) => /^(src|web|scripts|test)\//.test(path))
      .map(([path, input]) => [
        path,
        input.imports
          .filter((i) => !i.external && /^(src|web|scripts|test)\//.test(i.path))
          .map((i) => i.path),
      ]),
  );
  expect(graph.size).toBeGreaterThan(200);
  expect(graph.has('scripts/who.mjs')).toBe(true);
  expect(graph.has('test/ui/bundle.mjs')).toBe(true);
  const visited = new Set();
  const cycles = [];
  function walk(path, chain = []) {
    const start = chain.indexOf(path);
    if (start >= 0) return cycles.push([...chain.slice(start), path].join(' -> '));
    if (visited.has(path)) return;
    visited.add(path);
    for (const dependency of graph.get(path) ?? []) walk(dependency, [...chain, path]);
  }
  for (const path of graph.keys()) walk(path);
  expect(cycles).toEqual([]);
  const reversed = [...graph].flatMap(([path, dependencies]) =>
    path.startsWith('src/storage/')
      ? dependencies.filter((d) => d.startsWith('src/vault/')).map((d) => path + ' -> ' + d)
      : [],
  );
  expect(reversed).toEqual([]);
});
