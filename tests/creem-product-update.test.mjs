import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const token = "local-test-admin-token";
const hash = createHash("sha256").update(token).digest("base64url");
const source = fs.readFileSync(new URL("../cloudflare/leemockups-download.js", import.meta.url), "utf8")
  .replace(/const ANALYTICS_ACCESS_HASH = "[^"]+";/, `const ANALYTICS_ACCESS_HASH = "${hash}";`);
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const sku = "LM-VM-MUG-001";
const imageUrl = `https://downloads.leemockups.com/mockups/${sku}/gallery/${sku}-gallery-1234abcd-5678-90ab-cdef-123456789abc.jpg`;

function environment(requestedKeys = []) {
  return {
    CREEM_API_KEY: "fake-test-key",
    CREEM_MODE: "live",
    DB: { prepare: () => ({ run: async () => ({}), bind() { return this; }, first: async () => ({ product_id: "prod_Existing123", discount_code: "LAUNCH", launch_active: 1, regular_price_cents: 999, launch_price_cents: 349 }) }) },
    MOCKUPS: { get: async (key) => { requestedKeys.push(key); return { body: "jpeg-bytes", size: 10, writeHttpMetadata() {} }; } },
  };
}

test("editing an existing Creem product patches its original ID and image", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
    return new Response(JSON.stringify({ id: "prod_Existing123", image_url: `https://www.creem.io/api/images?url=${encodeURIComponent(imageUrl)}` }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const request = new Request("https://downloads.leemockups.com/admin/creem-product-sync", {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ sku, name: "Updated Mug", description: "Updated details", imageUrl, regularPriceCents: 999, launchPriceCents: 349 }),
    });
    const response = await worker.fetch(request, environment(), {});
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.productId, "prod_Existing123");
    assert.equal(result.updated, true);
    assert.deepEqual(calls, [{
      url: "https://api.creem.io/v1/products/prod_Existing123", method: "PATCH",
      body: { name: "Updated Mug", description: "Updated details", image_url: imageUrl },
    }, { url: "https://api.creem.io/v1/products/prod_Existing123", method: "GET", body: undefined }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("existing Creem prices cannot silently drift from Publisher settings", async () => {
  const request = new Request("https://downloads.leemockups.com/admin/creem-product-sync", {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ sku, name: "Updated Mug", description: "Updated details", imageUrl, regularPriceCents: 1099, launchPriceCents: 349 }),
  });
  const response = await worker.fetch(request, environment(), {});
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /prices differ/);
});

test("the new public gallery image URL is available while private paths stay closed", async () => {
  const requestedKeys = [];
  const env = environment(requestedKeys);
  const image = await worker.fetch(new Request(imageUrl, { method: "HEAD" }), env, {});
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/jpeg");
  assert.deepEqual(requestedKeys, [`mockups/${sku}/gallery/${sku}-gallery-1234abcd-5678-90ab-cdef-123456789abc.jpg`]);
  await worker.fetch(new Request(`https://downloads.leemockups.com/private/mockups/${sku}/${sku}.mockup`), env, {});
  assert.equal(requestedKeys.length, 1);
});
