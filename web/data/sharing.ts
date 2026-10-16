import { useEffect, useState } from 'preact/hooks';
import * as api from './api.ts';
import { current, epoch, listen } from './private.ts';

interface Sharing {
  tag: boolean | null;
  at: 'loading' | 'ready' | 'saving' | 'failed';
  error: 'read' | 'write' | null;
}
const empty = (): Sharing => ({ tag: null, at: 'loading', error: null });
let state = empty();
let serial = 0;
let reading: Promise<void> | null = null;
let writing: Promise<void> | null = null;
const listeners = new Set<(next: Sharing) => void>();
const tell = (next: Sharing) => {
  state = next;
  for (const fn of listeners) fn(next);
};
listen(() => {
  serial++;
  reading = writing = null;
  tell(empty());
});

/** A reopen joins a pending write instead of reading its preceding value. No polling. */
export function refreshSharing(): Promise<void> {
  if (writing) return writing;
  if (reading) return reading;
  if (state.error === 'write') return Promise.resolve();
  const generation = epoch();
  const request = ++serial;
  const active = () => current(generation) && request === serial;
  tell(empty());
  const task = api
    .sharing()
    .then((value) => {
      if (!active() || api.reseeded(value)) return;
      if (typeof value.tag !== 'boolean') throw new Error('preference');
      tell({ tag: value.tag, at: 'ready', error: null });
    })
    .catch(() => {
      if (active()) tell({ tag: null, at: 'failed', error: 'read' });
    })
    .finally(() => {
      if (reading === task) reading = null;
    });
  reading = task;
  return task;
}

export function saveTag(tag: boolean): Promise<void> {
  if (writing) return writing;
  const generation = epoch();
  const request = ++serial;
  const active = () => current(generation) && request === serial;
  tell({ tag, at: 'saving', error: null });
  const task = api
    .post<{ tag: boolean }>('/api/sharing', { tag })
    .then((value) => {
      if (!active() || api.reseeded(value)) return;
      if (value.tag !== tag) throw new Error('preference');
      tell({ tag, at: 'ready', error: null });
    })
    .catch(() => {
      if (active()) tell({ tag, at: 'failed', error: 'write' });
    })
    .finally(() => {
      if (writing === task) writing = null;
    });
  writing = task;
  return task;
}

export const retrySharing = () =>
  state.error === 'write' && state.tag !== null ? saveTag(state.tag) : refreshSharing();

export function useSharing() {
  // Never paint a previously cached visible tag before this opening's read succeeds.
  const [value, set] = useState<Sharing>(empty);
  useEffect(() => {
    listeners.add(set);
    void refreshSharing();
    set(state);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return value;
}
