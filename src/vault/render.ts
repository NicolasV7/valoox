// One skin's picture, fetched.
//
// In the vault because that is where a Riot hostname lives, and the rule is
// the architecture: src/vault/ is anything Riot-facing and a test fails the
// build if a hostname leaks out of it. The route that answers with this is
// routes/render.ts, which knows nothing about where the bytes come from.
//
// The url is built here from a uuid and never taken from a request, which is
// the same rule the Discord webhook follows: nothing user-supplied reaches
// fetch(). The pattern in upstream.ts pins the host and the path, and a uuid
// cannot walk out of either.

import { rf } from './http.ts';

const CDN = 'https://media.valorant-api.com/weaponskinlevels/';

export const fetchRender = (id: string): Promise<Response> => rf(CDN + id + '/displayicon.png');
