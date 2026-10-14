import { t } from '../i18n/index.ts';

/** Failed rotations keep the current screen available for bounded retries and manual recovery. */
export function StoreRefresh({ busy, onRetry }: { busy: boolean; onRetry: () => Promise<void> }) {
  return (
    <div class="store-refresh" role="status">
      <span>{t().store.refreshFailed}</span>
      <button type="button" disabled={busy} onClick={onRetry}>
        {t().store.retry}
      </button>
    </div>
  );
}
