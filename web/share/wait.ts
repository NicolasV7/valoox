/** A cancelled export cannot retain a pending catalogue, font or canvas task. */
export function wait<T>(task: Promise<T>, signal: AbortSignal, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (ok: boolean, value: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      if (ok) resolve(value as T);
      else reject(value);
    };
    const abort = () => finish(false, new DOMException('', 'AbortError'));
    const timer = setTimeout(() => finish(false, new Error('timeout')), ms);
    task.then(
      (value) => finish(true, value),
      (error) => finish(false, error),
    );
    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
  });
}
