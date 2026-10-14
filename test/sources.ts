import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface Source {
  path: string;
  text: string;
}

/** Shared inventory for source contracts, including explicitly named root files. */
export function sources(root: string, extension = /\.(ts|tsx)$/): Source[] {
  if (!existsSync(root)) return [];
  if (statSync(root).isFile()) {
    const path = root.replace(/\\/g, '/');
    return extension.test(path) ? [{ path, text: readFileSync(root, 'utf8') }] : [];
  }
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() || entry.isFile() ? sources(join(root, entry.name), extension) : [],
  );
}
