import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function loadTs(path, overrides = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  }}).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => overrides[id] ?? require(id), module, module.exports);
  return module.exports;
}
const commerce = loadTs("../lib/commerce.ts");
const { MockupPrice } = loadTs("../components/mockup-price.tsx", { "@/lib/commerce": commerce });
const render = product => renderToStaticMarkup(createElement(MockupPrice, { product }));

test("launch price shows the regular price struck through", () => {
  const html = render({ purchaseProvider: "CREEM", priceUsd: 3.49 });
  assert.match(html, /<strong>\$3\.49<\/strong>/);
  assert.match(html, /<s [^>]*>\$9\.99<\/s>/);
  assert.match(html, /Launch Special/);
});
test("regular price, free and non-Creem products do not show a launch discount", () => {
  for (const product of [
    { purchaseProvider: "CREEM", priceUsd: 9.99 },
    { purchaseProvider: "CREEM", priceUsd: 3.49, isFree: true },
    { purchaseProvider: "PADDLE", priceUsd: 3.49 },
  ]) {
    const html = render(product);
    assert.doesNotMatch(html, /<s |Launch Special/);
    assert.match(html, product.isFree ? /<strong>Free<\/strong>/ : /<strong>\$/);
  }
});
