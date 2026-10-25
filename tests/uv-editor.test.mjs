import test from 'node:test';
import assert from 'node:assert/strict';
import { artworkRect, artworkUv, visitUvTriangles } from '../public/composer/uv-editor.mjs';

test('flat and indexed mockup meshes expose the same UV triangle', () => {
  const vertices = new Float32Array([
    0, 0, 1, .1, .2,
    0, 0, 1, .8, .2,
    0, 0, 1, .1, .9,
  ]);
  const expected = [[.1, .2, .8, .2, .1, .9]];
  const flat = [];
  const indexed = [];
  assert.equal(visitUvTriangles(vertices, (...uv) => flat.push(uv)), 1);
  assert.equal(visitUvTriangles({ vertices, indices: new Uint16Array([0, 1, 2]) }, (...uv) => indexed.push(uv)), 1);
  assert.deepEqual(flat, indexed);
  for (const [actual, target] of flat[0].map((value, index) => [value, expected[0][index]])) {
    assert.ok(Math.abs(actual - target) < 1e-6);
  }
});

test('artwork placement preserves aspect and matches shader UV sampling', () => {
  const rect = artworkRect(200, 100, 400, 400, 1.5, .6, .4);
  assert.deepEqual(rect, { x: -60, y: 10, width: 600, height: 300 });
  const center = artworkUv(.6, .4, 1.5, .6, .4);
  assert.deepEqual(center, { u: .5, v: .5 });
  const corner = artworkUv(rect.x / 400, rect.y / 400, 1.5, .6, .4);
  assert.ok(Math.abs(corner.u) < 1e-12);
  assert.ok(Math.abs(corner.v - .25) < 1e-12);
});
