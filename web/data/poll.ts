/** One request at a time, only while visible, online and before the deadline. */
export function poll(work: () => Promise<unknown>, until: number, every = 4000): () => void {
  if (!Number.isFinite(until) || !Number.isFinite(every) || every < 1000) return () => {};
  let active = true;
  let busy = false;
  let timer = 0;
  let next = Date.now() + every;
  const schedule = () => {
    clearTimeout(timer);
    if (!active || Date.now() >= until) return;
    timer = window.setTimeout(wake, Math.min(until - Date.now(), Math.max(0, next - Date.now())));
  };
  const wake = async () => {
    clearTimeout(timer);
    if (!active || Date.now() >= until || document.hidden || navigator.onLine === false || busy)
      return;
    if (Date.now() < next) return schedule();
    busy = true;
    try {
      await work();
    } catch {
      // The caller owns its error state; a failure must still respect the deadline.
    } finally {
      busy = false;
      next = Date.now() + every;
      schedule();
    }
  };
  document.addEventListener('visibilitychange', wake);
  for (const event of ['focus', 'online', 'pageshow']) window.addEventListener(event, wake);
  schedule();
  return () => {
    active = false;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', wake);
    for (const event of ['focus', 'online', 'pageshow']) window.removeEventListener(event, wake);
  };
}
