import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { build } from 'esbuild';
import { host } from './hooks.mjs';

export async function fixture(entry, actor, globals = {}) {
  const root = process.cwd();
  const hooks = host();
  const mocks = {
    'web/route.ts':
      "export const useRoute=()=>({name:'collection',tab:'weapons'}); export const wasAt=()=>0; export const go=(r)=>globalThis.routes.push(r); export const href=(r)=>'/'+r.name; export const intercept=()=>()=>{}; export const ALERTS={name:'alerts'};",
    'web/sign-in.ts':
      'export const useScan=(fn)=>{ globalThis.approve=fn; return {state:null,start:()=>{},prefetch:()=>{}}; };',
  };
  const ui = [
    'web/screen.tsx',
    'web/components/Tabs.tsx',
    'web/components/Back.tsx',
    'web/screens/Account.gone.tsx',
    'web/screens/Fail.tsx',
    'web/screens/Gate.tsx',
    'web/screens/Scan.tsx',
    'web/screens/Stopped.tsx',
    'web/screens/Store.loading.tsx',
  ];
  for (const path of ui) {
    const name = path.split('/').pop().split('.')[0];
    const exported = path.endsWith('Account.gone.tsx')
      ? 'AccountGone'
      : path.endsWith('Store.loading.tsx')
        ? 'StoreLoading'
        : name === 'screen'
          ? 'Screen'
          : name;
    mocks[path] = 'export function ' + exported + '(){return null;}';
  }
  const result = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'ts' },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    target: 'node24',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    plugins: [
      {
        name: 'fixtures',
        setup(builder) {
          builder.onResolve({ filter: /^preact\/hooks$/ }, () => ({
            path: 'hooks',
            namespace: 'fixture',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
            contents:
              'export const {useState,useRef,useMemo,useCallback,useEffect,useLayoutEffect}=globalThis.hooks;',
          }));
          builder.onLoad({ filter: /[\\/]web[\\/].*\.(ts|tsx)$/ }, async ({ path }) => {
            const key = path.slice(root.length + 1).replace(/\\/g, '/');
            return {
              contents: mocks[key] ?? (await readFile(path, 'utf8')),
              loader: path.endsWith('tsx') ? 'tsx' : 'ts',
            };
          });
        },
      },
    ],
    absWorkingDir: resolve(root),
  });
  const context = {
    module: { exports: {} },
    hooks: hooks.hooks,
    actor,
    AbortController,
    setTimeout: (fn, delay) => {
      const timer = setTimeout(fn, delay);
      timer.unref?.();
      return timer;
    },
    clearTimeout,
    setInterval: () => 1,
    clearInterval: () => {},
    document: Object.assign(new EventTarget(), { hidden: false }),
    navigator: { onLine: true },
    routes: [],
    calls: [],
    fetch: async (path, init) => {
      context.calls.push({ path, body: init?.body ? JSON.parse(init.body) : null });
      const reply = await actor.reply?.(path, init);
      if (reply) return reply;
      if (path === '/api/logout' && actor.fail) throw new Error('fixture');
      const value =
        path === '/api/logout'
          ? { ok: true }
          : path === '/api/store'
            ? actor.store
            : path === '/api/inventory'
              ? actor.inventory
              : actor.prefs;
      return { ok: true, json: async () => value };
    },
    ...globals,
  };
  context.window ??= Object.assign(new EventTarget(), { setTimeout: context.setTimeout });
  runInNewContext(result.outputFiles[0].text, context);
  const app = context.module.exports;
  return {
    app,
    context,
    dispose: () => hooks.dispose(),
    render(fn) {
      hooks.begin();
      const tree = fn();
      hooks.flush();
      return tree;
    },
    async settle() {
      for (let i = 0; i < 8; i++) await Promise.resolve();
    },
  };
}
