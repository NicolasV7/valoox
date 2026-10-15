import { useEffect, useState } from 'preact/hooks';
import { useLeft } from '../components/Countdown.tsx';
import { useAction } from './action.ts';
import { post, reseeded } from './api.ts';
import { held, reload, useWatch } from './channel.ts';
import { listen } from './private.ts';
import type { Prefs } from './types.ts';

interface Code {
  value: string;
  until: number;
  seen: boolean;
}
type Problem = 'network' | 'unavailable' | null;
const checkingNow = () => {
  const link = held()?.discordLink;
  return link?.state === 'checking' && link.until > Date.now();
};

/** The raw one-time code lives only on the open screen, never in browser storage. */
export function useDiscord(prefs: Prefs | null) {
  const [code, setCode] = useState<Code | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [removed, setRemoved] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const { busy, run } = useAction();
  const wait = useLeft(cooldown);
  const pending = prefs?.discordLink;
  const until = code?.until ?? pending?.until ?? null;
  const left = useLeft(until);
  const checking = pending?.state === 'checking' && left > 0;
  const completed = !!code && !pending && prefs?.discord?.ok === true;
  const polling = pending ? ['waiting', 'checking'].includes(pending.state) : !!code && !completed;
  useWatch(polling && left > 0 ? until : null);
  useEffect(
    () =>
      listen(() => {
        setCode(null);
        setProblem(null);
      }),
    [],
  );
  useEffect(() => {
    if (completed || (code?.seen && !pending)) setCode(null);
    else if (code?.seen && pending && pending.until !== code.until) setCode(null);
    else if (code && !code.seen && pending?.until === code.until) setCode({ ...code, seen: true });
  }, [completed, code, pending?.until, pending?.state]);

  const failed = () => setProblem('network');
  const start = () =>
    checkingNow() || held()?.discord?.ok === true
      ? Promise.resolve()
      : run(async (active) => {
          setProblem(null);
          setRemoved(false);
          const result = await post<{
            code?: string;
            until?: number;
            error?: string;
            wait?: number;
            connected?: boolean;
          }>('/api/discord', { action: 'start' });
          if (!active() || reseeded(result)) return;
          if (result.connected || result.error === 'checking') {
            setCode(null);
            await reload();
            return;
          }
          if (result.error === 'wait') {
            setCooldown(Date.now() + (result.wait ?? 60) * 1000);
            return;
          }
          if (
            !result.code ||
            !/^[0-9a-f]{32}$/.test(result.code) ||
            !Number.isFinite(result.until)
          ) {
            setProblem('unavailable');
            return;
          }
          const value = result.code;
          const deadline = result.until as number;
          const refreshed = await reload();
          if (!active()) return;
          setCode({
            value,
            until: deadline,
            seen: refreshed && held()?.discordLink?.until === deadline,
          });
          if (!refreshed) setProblem('network');
        }, failed);

  const remove = () =>
    checkingNow()
      ? Promise.resolve()
      : run(async (active) => {
          setProblem(null);
          const result = await post<{ ok?: boolean; error?: string }>('/api/discord', {
            action: 'remove',
          });
          if (!active() || reseeded(result)) return;
          if (result.error === 'checking') {
            await reload();
            return;
          }
          if (!result.ok || !(await reload())) {
            if (active()) failed();
            return;
          }
          if (!active()) return;
          if (held()?.discord || held()?.discordLink) {
            failed();
            return;
          }
          setCode(null);
          setRemoved(true);
        }, failed);

  const refresh = () =>
    run(async (active) => {
      setProblem(null);
      if (!(await reload()) && active()) failed();
    }, failed);

  return {
    code,
    left,
    wait,
    until,
    problem,
    removed,
    busy,
    checking,
    locked: busy || checking,
    start,
    remove,
    refresh,
  };
}

export type DiscordFlow = ReturnType<typeof useDiscord>;
