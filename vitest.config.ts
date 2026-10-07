import { readFileSync } from 'node:fs';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// Two projects, because they need different runtimes and both earn their place.
//
// unit: pure modules in plain Node. Fast, no bindings needed.
// workers: the storage layer inside real workerd against real local D1 — the one
// that would have caught `UNIQUE constraint failed: s.uid`, a bug that only fires
// when a browser signs in a second time, which is exactly when the user has no
// working session to fall back on.
export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'unit', include: ['test/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './wrangler.toml' },
            // The workerd that ships with the pool supports compatibility dates
            // only up to 2026-08-22, and production is on 2026-09-01. Overriding
            // it here rather than lowering production is the right way round, but
            // it does mean these tests run ten days behind the real runtime.
            // Raise it the moment the pool ships a newer binary.
            miniflare: { compatibilityDate: '2026-08-22' },
          }),
        ],
        test: {
          name: 'workers',
          include: ['test/workers/**/*.test.ts'],
          // One source of truth for the schema. Inlining it in the test would let
          // production and the tests drift apart silently, which is the exact
          // class of bug these tests exist to catch.
          provide: { schema: readFileSync('schema.sql', 'utf8') },
        },
      },
    ],
  },
});
