import assert from "node:assert/strict";
import test from "node:test";
import worker from "./leemockups-download.js";

const sku = "LM-VM-MUG-002";
const key = `private/mockups/${sku}/${sku}.mockup`;
let isFree = true;
let published = true;
let hasFile = true;
const mockup = {
  size: 4,
  body: new Blob(["test"]).stream(),
  writeHttpMetadata() {},
};
const env = {
  DOWNLOAD_SECRET: "test-secret",
  MOCKUPS: {
    async get(objectKey) {
      if (objectKey === "public/catalog/products.json") {
        return { async json() { return { products: published ? [{ sku, isFree }] : [] }; } };
      }
      return objectKey === key && hasFile ? mockup : null;
    },
    async head(objectKey) {
      return objectKey === key && hasFile ? { size: 4 } : null;
    },
  },
};
const request = (path, method = "GET") => worker.fetch(new Request(`https://downloads.leemockups.com${path}`, { method }), env);

test("a published free mockup redirects to the existing private download route", async () => {
  isFree = true;
  published = true;
  hasFile = true;
  const redirect = await request(`/free/${sku}`, "HEAD");
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("cache-control"), "no-store");
  const signed = new URL(redirect.headers.get("location"));
  assert.equal(signed.pathname, `/d/${sku}`);
  assert.equal(signed.searchParams.get("ref"), "free");
  const download = await request(signed.pathname + signed.search, "HEAD");
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-disposition"), /attachment/);

  isFree = false;
  assert.equal((await request(signed.pathname + signed.search, "HEAD")).status, 404);
  assert.equal((await request(`/free/${sku}`, "HEAD")).status, 404);
});

test("an unpublished or missing file cannot be downloaded for free", async () => {
  isFree = true;
  published = false;
  assert.equal((await request(`/free/${sku}`, "HEAD")).status, 404);
  published = true;
  hasFile = false;
  assert.equal((await request(`/free/${sku}`, "HEAD")).status, 404);
});
