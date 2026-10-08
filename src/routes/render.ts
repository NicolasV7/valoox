// One skin's picture, served from this origin.
//
// A message cannot carry a third party. Everything else in one is ours —
// the mark, the stickers — and an <img> pointing at the community CDN would
// hand every reader's mail client, and whatever scans it on the way, a
// request to somebody else's host with our message's timing on it.
//
// So this fetches it once and hands it back. It is the only route in the app
// that returns something other than JSON, and the only one whose answer is
// the same for everybody, which is why it needs no session and can be cached
// for a year: a skin level's render is immutable — the uuid IS the version.
//
// Where the bytes come from is vault/render.ts, because that is where a Riot
// hostname is allowed to live. This half is the uuid, the cache header and
// the one decision: a miss is a 404 and not an error, since the catalogue has
// 47 skins with no render at all and a message asking for one of those should
// get a gap.

import { fetchRender } from '../vault/render.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** A year. The uuid is the version, so there is nothing to invalidate. */
const CACHE = 'public, max-age=31536000, immutable';

export async function render(req: Request): Promise<Response> {
  const id = new URL(req.url).pathname.slice('/render/'.length).replace(/\.png$/, '');
  if (!UUID.test(id)) return new Response(null, { status: 404 });

  const res = await fetchRender(id);
  // A miss is a miss: the catalogue has 47 skins with no render at all, and a
  // message asking for one of those should get a gap rather than an error.
  if (!res.ok) return new Response(null, { status: 404 });

  return new Response(res.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': CACHE,
      // Everything this origin serves says this, and an image proxied off
      // somebody else's CDN is exactly where it would otherwise be guessed.
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** What a message points at. The Worker has no catalogue and does not need
 *  one: a skin level's uuid is the whole address. */
export const renderAt = (origin: string, id: string): string => origin + '/render/' + id + '.png';
