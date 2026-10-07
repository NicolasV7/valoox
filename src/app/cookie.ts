// The browser's only identifier. Sixteen random bytes, and the sole link between
// a person and a row — the Riot puuid never appears outside the sealed blob.
//
// Path=/api keeps the cookie off every static asset request. SameSite=Strict plus
// a Sec-Fetch-Site check on writes covers CSRF with no server-side token, which
// matters because a token would need exactly the per-session state being avoided.

const NAME = 'uid';
const MAX_AGE = 14 * 86400;

export function mint(): string {
  const u = crypto.getRandomValues(new Uint8Array(16));
  return [...u].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function read(req: Request): string | null {
  const raw = req.headers.get('cookie');
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k !== NAME) continue;
    const v = rest.join('=');
    // Exactly 32 hex characters or it did not come from mint().
    return /^[0-9a-f]{32}$/.test(v) ? v : null;
  }
  return null;
}

export function set(h: Headers, uid: string): void {
  h.append(
    'Set-Cookie',
    NAME + '=' + uid + '; Max-Age=' + MAX_AGE + '; Path=/api; Secure; HttpOnly; SameSite=Strict',
  );
}

export function clear(h: Headers): void {
  h.append('Set-Cookie', NAME + '=; Max-Age=0; Path=/api; Secure; HttpOnly; SameSite=Strict');
}

/** Browser-set and unspoofable. Blocks cross-site writes without a CSRF token.
 *  Absent on same-origin navigations from very old browsers, hence the allowance
 *  for a missing header rather than a hard requirement. */
export function sameOrigin(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  return site === null || site === 'same-origin' || site === 'none';
}
