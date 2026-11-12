import test from "node:test";
import assert from "node:assert/strict";
import worker from "./leemockups-download.js";

const url = "https://downloads.leemockups.com";

test("email signup stays hidden until the sender is deliberately enabled", async () => {
  const response = await worker.fetch(new Request(`${url}/updates/config`), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { enabled: false });
});

test("announcement requires publisher authorization", async () => {
  const response = await worker.fetch(new Request(`${url}/updates/admin/announce`, { method: "POST" }), {});
  assert.equal(response.status, 401);
});

test("opening a confirmation email does not subscribe until the button is pressed", async () => {
  const token = "a".repeat(43);
  let activated = false;
  const env = {
    UPDATES_ENABLED: "true", DIRECTMAIL_ACCESS_KEY_ID: "test", DIRECTMAIL_ACCESS_KEY_SECRET: "test",
    DIRECTMAIL_CONFIRM_ACCOUNT_NAME: "confirm@example.com", DIRECTMAIL_NEWS_ACCOUNT_NAME: "news@example.com",
    UPDATES_TOKEN_SECRET: "test", MOCKUPS: {},
    DB: { prepare(query) {
      return {
        bind() { return this; },
        async run() { if (query.startsWith("UPDATE mockup_update_subscribers")) activated = true; },
        async first() { return { email: "reader@example.com", confirm_expires: "2999-01-01T00:00:00.000Z" }; },
      };
    } },
  };
  const confirmUrl = `${url}/updates/confirm?token=${token}`;
  const preview = await worker.fetch(new Request(confirmUrl), env);
  assert.equal(preview.status, 200);
  assert.match(await preview.text(), /Confirm subscription/);
  assert.equal(activated, false);
  const confirmed = await worker.fetch(new Request(confirmUrl, { method: "POST" }), env);
  assert.match(await confirmed.text(), /Subscription confirmed/);
  assert.equal(activated, true);
});

test("publisher counts subscribers and sends one combined announcement only on request", async () => {
  const skus = ["LM-VM-MUG-001", "LM-VM-SHI-001"];
  const delivered = new Set();
  const messages = [];
  const token = "publisher-test-token";
  const hash = Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))).toString("base64url");
  const env = {
    UPDATES_ENABLED: "true", DIRECTMAIL_ACCESS_KEY_ID: "test", DIRECTMAIL_ACCESS_KEY_SECRET: "test",
    DIRECTMAIL_CONFIRM_ACCOUNT_NAME: "confirm@example.com", DIRECTMAIL_NEWS_ACCOUNT_NAME: "news@example.com",
    UPDATES_TOKEN_SECRET: "test", ANALYTICS_ACCESS_HASH: hash,
    MOCKUPS: { async get() { return { async json() { return { products: skus.map((sku) => ({ sku, name: `Mockup ${sku}` })) }; } }; } },
    DB: { prepare(query) {
      return {
        args: [], bind(...args) { this.args = args; return this; },
        async run() {
          if (query.startsWith("INSERT OR IGNORE INTO mockup_update_deliveries")) delivered.add(`${this.args[0]}:${this.args[1]}`);
        },
        async first() {
          if (query.startsWith("SELECT COUNT(*) AS n FROM mockup_update_subscribers")) {
            return { n: skus.some((sku) => !delivered.has(`${sku}:reader@example.com`)) ? 1 : 0 };
          }
          throw new Error(`Unexpected query: ${query}`);
        },
        async all() {
          if (query.startsWith("SELECT status, COUNT(*)")) return { results: [{ status: "active", n: 1 }, { status: "pending", n: 1 }] };
          if (query.startsWith("SELECT d.sku, COUNT(*)")) return { results: skus.filter((sku) => delivered.has(`${sku}:reader@example.com`)).map((sku) => ({ sku, n: 1, last_sent: "2026-11-12T00:00:00.000Z" })) };
          if (query.startsWith("SELECT email FROM mockup_update_subscribers")) return { results: skus.some((sku) => !delivered.has(`${sku}:reader@example.com`)) ? [{ email: "reader@example.com" }] : [] };
          if (query.startsWith("SELECT sku FROM mockup_update_deliveries")) return { results: skus.filter((sku) => delivered.has(`${sku}:reader@example.com`)).map((sku) => ({ sku })) };
          throw new Error(`Unexpected query: ${query}`);
        },
      };
    } },
  };
  const admin = (path, body) => worker.fetch(new Request(`${url}/updates/admin/${path}`, {
    method: body ? "POST" : "GET", headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }), env);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    messages.push(new URLSearchParams(options.body));
    return new Response(JSON.stringify({ EnvId: "test" }), { status: 200 });
  };
  try {
    const status = await (await admin("status")).json();
    assert.equal(status.subscribers.active, 1);
    assert.equal(status.subscribers.pending, 1);
    assert.equal(status.products[0].pendingCount, 1);
    assert.equal((await (await admin("preview", { skus })).json()).recipients, 1);
    assert.equal(messages.length, 0);
    const sent = await (await admin("announce", { skus })).json();
    assert.equal(sent.sent, 1);
    assert.equal(sent.remaining, 0);
    assert.equal(messages.length, 1);
    assert.match(messages[0].get("TextBody"), /LM-VM-MUG-001/);
    assert.match(messages[0].get("TextBody"), /LM-VM-SHI-001/);
    assert.equal((await (await admin("announce", { skus })).json()).sent, 0);
    assert.equal(messages.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
