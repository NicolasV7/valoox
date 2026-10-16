import { useState } from 'preact/hooks';
import { useLeft } from '../components/Countdown.tsx';
import type { StoreView } from '../data/types.ts';
import { t } from '../i18n/index.ts';
import { ShareDialog } from './dialog.tsx';
import { live, snapshot } from './model.ts';

export function StoreShare({ view }: { view: StoreView }) {
  const [source, setSource] = useState<{
    view: StoreView;
    snapshot: ReturnType<typeof snapshot>;
  } | null>(null);
  const until = (view.fetchedAt + view.remaining) * 1000;
  const left = useLeft(Number.isFinite(until) ? until : null);
  const available = left > 0 && view.offers.length > 0;
  const s = t().share;
  function open() {
    const value = snapshot(view);
    if (live(value)) setSource({ view, snapshot: value });
  }
  return (
    <>
      <button
        type="button"
        class="store__share"
        disabled={!available}
        title={!available ? s.unavailable : s.intro}
        onClick={open}
      >
        {s.open}
      </button>
      {source?.view === view && (
        <ShareDialog source={source.snapshot} onClose={() => setSource(null)} />
      )}
    </>
  );
}
