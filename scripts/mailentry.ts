// What `npm run mail` renders: one of each message, with plausible contents.
//
// The only way to look at a message without sending one, which matters more
// here than it sounds — every bug this design has had was a rendering bug
// that no test could have caught, and the loop of send, open on a phone,
// squint was slow enough that one of them shipped twice.
//
import { html as codeHtml } from '../src/alerts/mail/code.ts';
import { html as alertHtml } from '../src/alerts/mail/alert.ts';

const ORIGIN = 'https://drop.valoox.store';
const STOP = ORIGIN + '/stop?t=preview';

export const code = () => codeHtml('418302', 10, 'en', ORIGIN, STOP, 'Termo#GOD');

const LEVELS = 'e7c63390-eda7-46e0-bb7a-a6abdacd2433';
const SPRAYS = 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475';

/** Today's real store, so the preview is a message that could have been sent.
 *  Rogue Vandal at 2,175, with the three it shares the panel with. */
const ROGUE = { id: '653c7c1d-4d92-3798-6314-eab5beb70ae6', name: 'Rogue Vandal', type: LEVELS };
const SMITE = { id: 'fd8e368e-4c29-b7da-eca4-78ad591d9b5c', name: 'Smite Ghost', type: LEVELS };
const BOLT = { id: '32d8d927-4009-308a-da58-7d98415c1917', name: 'Bolt Knife', type: LEVELS };
const SPRAY = { id: '1658e811-4084-8775-28df-5a9feabc52d8', name: 'Reaver', type: SPRAYS };

/** One gun matched: the common case and the one the design is drawn for. */
export const alert = () => alertHtml([ROGUE], 49926, 'en', ORIGIN, STOP, 'Termo#GOD');

/** Three matched, one of them an accessory with no derivable render. The
 *  edge the layout has to survive: a picture, a picture, and a name. */
export const alertMany = () =>
  alertHtml([ROGUE, SMITE, BOLT, SPRAY], 49926, 'en', ORIGIN, STOP, 'Termo#GOD');

/** Nothing drawable at all — a week where only accessories matched. */
export const alertBare = () =>
  alertHtml([SPRAY], 400_000, 'en', ORIGIN, STOP, 'Termo#GOD');
