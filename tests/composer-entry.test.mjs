import test from 'node:test';
import assert from 'node:assert/strict';
import { startComposer } from '../public/composer/composer-entry.mjs';

test('an empty or invalid selection never starts the renderer or loading UI', async () => {
  for (const search of ['', '?sku=', '?sku=invalid', '?utm_source=directory']) {
    let started = 0;
    const result = await startComposer({search, loadRenderer(){started++;}, showLoading(){started++;}, showError(){started++;}});
    assert.equal(result, false);
    assert.equal(started, 0);
  }
});

test('an explicit free or purchased SKU starts its renderer once', async () => {
  for (const search of ['?sku=LM-VM-SHI-001', '?sku=LM-VM-MUG-001']) {
    const calls=[];
    assert.equal(await startComposer({search, showLoading(){calls.push('loading');}, async loadRenderer(){calls.push('renderer');}, showError(){assert.fail('Unexpected error');}}), true);
    assert.deepEqual(calls, ['loading','renderer']);
  }
});

test('a renderer load failure is displayed without another loading attempt', async () => {
  const failure = new Error('Network unavailable');
  let shown;
  await startComposer({search:'?sku=LM-VM-FRA-002', showLoading(){}, async loadRenderer(){throw failure;}, showError(error){shown=error;}});
  assert.equal(shown,failure);
});
