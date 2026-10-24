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

test("only a site-origin, non-crawler button click creates a separate download event", async () => {
  isFree = true;
  published = true;
  const inserts = [];
  env.DB = {
    async batch() {},
    prepare(sql) {
      return {
        bind(...values) { this.values = values; return this; },
        async all() { return { results: sql.startsWith("PRAGMA") ? [{ name: "mode" }] : [] }; },
        async run() { inserts.push({ sql, values: this.values }); },
      };
    },
  };
  const fields = {
    kind: "free-mockup",
    item: sku,
    visitorId: "11111111-1111-4111-8111-111111111111",
    clickId: "22222222-2222-4222-8222-222222222222",
  };
  const createRequest = (origin, overrides = {}) => new Request("https://downloads.leemockups.com/events/download-click", {
    method: "POST", headers: { Origin: origin }, body: new URLSearchParams({ ...fields, ...overrides }),
  });
  assert.equal((await worker.fetch(createRequest("https://other.example"), env)).status, 403);
  const crawler = createRequest("https://www.leemockups.com");
  Object.defineProperty(crawler, "cf", { value: { verifiedBotCategory: "Search Engine Crawler" } });
  assert.equal((await worker.fetch(crawler, env)).status, 204);
  assert.equal(inserts.length, 0);
  assert.equal((await worker.fetch(createRequest("https://www.leemockups.com"), env)).status, 204);
  assert.equal(inserts.length, 1);
  assert.deepEqual(inserts[0].values.slice(1, 3), ["free-mockup", sku]);
  assert.notEqual(inserts[0].values[3], fields.visitorId);

  isFree = false;
  assert.equal((await worker.fetch(createRequest("https://www.leemockups.com", { kind: "paid-mockup" }), env)).status, 204);
  assert.equal(inserts.length, 2);
  assert.equal((await worker.fetch(createRequest("https://www.leemockups.com", { kind: "desktop-app", item: "windows" }), env)).status, 204);
  assert.equal(inserts.length, 3);
  assert.equal((await worker.fetch(createRequest("https://www.leemockups.com", { kind: "desktop-app", item: "unknown" }), env)).status, 400);
});

test("browser access streams only a published free package to the official site without caching", async () => {
  isFree = true;
  published = true;
  hasFile = true;
  const browserRequest = (origin, method = "GET") => worker.fetch(new Request(
    `https://downloads.leemockups.com/browser/free/${sku}`,
    { method, headers: origin ? { Origin: origin } : {} },
  ), env);
  assert.equal((await browserRequest("https://other.example")).status, 403);
  assert.equal((await browserRequest("")).status, 403);
  const response = await browserRequest("https://www.leemockups.com");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://www.leemockups.com");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("content-type"), "application/octet-stream");
  assert.equal(await response.text(), "test");
  const head = await browserRequest("https://leemockups.com", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.body, null);
  assert.equal((await browserRequest("https://www.leemockups.com", "POST")).status, 405);
  isFree = false;
  assert.equal((await browserRequest("https://www.leemockups.com")).status, 404);
  isFree = true;
  hasFile = false;
  assert.equal((await browserRequest("https://www.leemockups.com")).status, 404);
  hasFile = true;
});
