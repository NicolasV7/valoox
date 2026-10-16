import assert from 'node:assert/strict';
import { test } from 'vitest';
import { fixture } from '../ui/bundle.mjs';

async function setup() {
  const actor = { requests: [] };
  const ui = await fixture(
    `
    export {usePoster} from './web/share/state.ts';
    export {reset} from './web/data/private.ts';
  `,
    actor,
    {},
    {
      'web/share/prepare.ts': `
      export const clear=canvas=>{canvas.cleared=true;};
      export function prepare(source,format,tag,signal){
        return new Promise((resolve,reject)=>actor.requests.push({source,format,tag,signal,resolve,reject}));
      }
    `,
    },
  );
  const source = {
    name: 'Player#VAL',
    card: null,
    fetchedAt: 1,
    until: Date.now() + 60000,
    offers: [{ id: 'skin', cost: 1775 }],
  };
  const render = (format = 'portrait', tag = true, attempt = 0) =>
    ui.render(() => ui.app.usePoster(source, format, tag, attempt));
  const complete = async (index = 0) => {
    const picture = { canvas: {}, file: {}, partial: false };
    actor.requests[index].resolve(picture);
    await ui.settle();
    return picture;
  };
  return { ui, actor, source, render, complete };
}

test('logout aborts preparation and rejects late pictures from the old account', async () => {
  const f = await setup();
  f.render();
  f.ui.app.reset('logout');
  assert.equal(f.actor.requests[0].signal.aborted, true);
  const late = await f.complete();
  assert.equal(late.canvas.cleared, true);
  assert.equal(f.render().state.at, 'stale');
  assert.equal(f.render().active(), false);
  f.ui.dispose();
});

test('an unresolved account tag preference never prepares a default-visible image', async () => {
  const f = await setup();
  assert.equal(f.render('portrait', null).state.at, 'loading');
  assert.equal(f.actor.requests.length, 0);
  f.render('portrait', false);
  assert.equal(f.actor.requests.length, 1);
  assert.equal(f.actor.requests[0].tag, false);
  await f.complete();
  assert.equal(f.render('portrait', false).state.at, 'ready');
  f.ui.dispose();
});

test('changing format or tag immediately hides the previous PNG while rebuilding', async () => {
  const f = await setup();
  f.render();
  const portrait = await f.complete();
  assert.equal(f.render().state.at, 'ready');
  assert.equal(f.render('compact', false).state.at, 'loading');
  assert.equal(portrait.canvas.cleared, true);
  await f.complete(1);
  assert.equal(f.render('compact', false).state.at, 'ready');
  f.ui.dispose();
});

test('closing the preview clears its private canvas', async () => {
  const f = await setup();
  f.render();
  const picture = await f.complete();
  f.render();
  f.ui.dispose();
  assert.equal(picture.canvas.cleared, true);
  assert.equal(f.actor.requests[0].signal.aborted, true);
});

test('closing while preparation is pending discards the late encoded picture', async () => {
  const f = await setup();
  f.render();
  f.ui.dispose();
  const late = await f.complete();
  assert.equal(late.canvas.cleared, true);
  assert.equal(f.actor.requests[0].signal.aborted, true);
});

test('expiry prevents sharing before a background timer or refresh can run', async () => {
  const f = await setup();
  f.render();
  await f.complete();
  f.source.until = Date.now() - 1;
  assert.equal(f.render().active(), false);
  f.ui.context.window.dispatchEvent(new Event('focus'));
  assert.equal(f.render().state.at, 'stale');
  f.ui.dispose();
});
