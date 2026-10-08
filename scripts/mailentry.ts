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

export const code = () => codeHtml('418302', 10, 'en', ORIGIN, STOP);
export const alert = () =>
  alertHtml(
    [
      { id: '1', name: 'Reaver Vandal' },
      { id: '2', name: 'Prime Classic' },
    ],
    49926,
    'en',
    ORIGIN,
    STOP,
  );
