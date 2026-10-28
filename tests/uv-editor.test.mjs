import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { artworkRect, artworkUv, resizeArtworkRect, visitUvTriangles } from '../public/composer/uv-editor.mjs';

test('flat and indexed mockup meshes expose the same UV triangle', () => {
  const vertices = new Float32Array([
    0, 0, 1, .1, .2,
    0, 0, 1, .8, .2,
    0, 0, 1, .1, .9,
  ]);
  const flat = [];
  const indexed = [];
  assert.equal(visitUvTriangles(vertices, (...uv) => flat.push(uv)), 1);
  assert.equal(visitUvTriangles({ vertices, indices: new Uint16Array([0, 1, 2]) }, (...uv) => indexed.push(uv)), 1);
  assert.deepEqual(flat, indexed);
  for (const [actual, target] of flat[0].map((value, index) => [value, [.1, .2, .8, .2, .1, .9][index]])) {
    assert.ok(Math.abs(actual - target) < 1e-6);
  }
});

test('artwork placement matches independent horizontal and vertical shader sampling', () => {
  const rect = artworkRect(200, 100, 400, 400, 1.5, 1.2, .6, .4);
  assert.deepEqual(rect, { x: -60, y: 40, width: 600, height: 240 });
  assert.deepEqual(artworkUv(.6, .4, 1.5, 1.2, .6, .4), { u: .5, v: .5 });
  const corner = artworkUv(rect.x / 400, rect.y / 400, 1.5, 1.2, .6, .4);
  assert.ok(Math.abs(corner.u) < 1e-12);
  assert.ok(Math.abs(corner.v - .25) < 1e-12);
});

test('corner handle keeps aspect and opposite corner fixed', () => {
  const resized = resizeArtworkRect({ x: 20, y: 30, width: 200, height: 100 }, 'nw', -40, -20, 10, 1200, 5, 600);
  assert.deepEqual(resized, { x: -20, y: 10, width: 240, height: 120 });
  assert.equal(resized.x + resized.width, 220);
  assert.equal(resized.y + resized.height, 130);
});

test('side handle stretches only one axis while fixing the opposite edge', () => {
  const resized = resizeArtworkRect({ x: 20, y: 30, width: 200, height: 100 }, 'e', 50, 70, 10, 1200, 5, 600);
  assert.deepEqual(resized, { x: 20, y: 30, width: 250, height: 100 });
});

test('composer loads its current preview and renderer assets', () => {
  const app = readFileSync(new URL('../public/composer/app-v6.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../public/composer/index.html', import.meta.url), 'utf8');
  const gpu = readFileSync(new URL('../public/composer/gpu-backface.js', import.meta.url), 'utf8');
  const editor = readFileSync(new URL('../public/composer/uv-editor-v3.mjs', import.meta.url), 'utf8');
  assert.match(app, /from '\.\/gpu-backface\.js'/);
  assert.match(app, /from '\.\/uv-editor-v3\.mjs'/);
  assert.match(app, /setCullBackfaces\(manifest\.templateId==='mug-v2'\)/);
  assert.match(gpu, /gl\.enable\(gl\.CULL_FACE\)/);
  assert.match(html, /src="\.\/app-v6\.js"/);
  assert.doesNotMatch(html, /id="(?:previewBtn|playResult|uvReset)"/);
  assert.doesNotMatch(editor, /resetButton/);
});
