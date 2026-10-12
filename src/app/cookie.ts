// __Host- prevents a sibling subdomain from planting the authentication cookie.
// Only a keyed fingerprint of this 256-bit secret is persisted in storage.
const NAME = '__Host-val';
const ATTR = '; Path=/; Secure; HttpOnly; SameSite=Strict';

export function mint(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function value(req: Request, name: string, pattern: RegExp): string | null {
  const matches = (req.headers.get('cookie') ?? '')
    .split(';')
    .map((p) => p.trim().split('='))
    .filter(([k]) => k === name);
  const v = matches.length === 1 ? matches[0]?.[1] : undefined;
  return v && pattern.test(v) ? v : null;
}

export const read = (req: Request) => value(req, NAME, /^[0-9a-f]{64}$/);
// An old cookie can nominate preferences, never authenticate an API request.
export const legacy = (req: Request) => value(req, 'uid', /^[0-9a-f]{32}$/);

export function set(h: Headers, secret: string): void {
  h.append('Set-Cookie', NAME + '=' + secret + '; Max-Age=' + 14 * 86400 + ATTR);
}

export function clear(h: Headers): void {
  h.append('Set-Cookie', NAME + '=; Max-Age=0' + ATTR);
  h.append('Set-Cookie', 'uid=; Max-Age=0; Path=/api; Secure; HttpOnly; SameSite=Strict');
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (origin !== null && origin !== new URL(req.url).origin) return false;
  const site = req.headers.get('sec-fetch-site');
  if (site !== null) return site === 'same-origin';
  return origin === new URL(req.url).origin;
}
