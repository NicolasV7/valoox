import { useState } from 'preact/hooks';

export function DiscordAvatar({ name, src }: { name: string; src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <span class="discord__avatar" aria-hidden="true">
      {src && !failed ? (
        <img src={src} alt="" width="72" height="72" onError={() => setFailed(true)} />
      ) : (
        <span>{[...name.trim()][0]?.toUpperCase() ?? '·'}</span>
      )}
    </span>
  );
}
