import { expect, test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';

test('search fields follow their screen key and clear on an account change', async () => {
  const f = await fixture(
    "export {useKept} from './web/data/kept.ts'; export {reset} from './web/data/private.ts';",
    {},
  );
  const render = (key) => f.render(() => f.app.useKept(key));
  try {
    render('first')[1]('first search');
    expect(render('first')[0]).toBe('first search');
    expect(render('second')[0]).toBe('');
    render('second')[1]('second search');
    expect(render('first')[0]).toBe('first search');
    expect(render('second')[0]).toBe('second search');
    f.app.reset('logout');
    expect(render('second')[0]).toBe('');
    expect(render('first')[0]).toBe('');
  } finally {
    f.dispose();
  }
});
