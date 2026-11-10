import assert from "node:assert/strict";
import test from "node:test";
import { buildGa4Purchase, sendGa4Purchase } from "./leemockups-download.js";

const sku = "LM-VM-SHI-001";
const checkout = {
  id: "ch_paid123", status: "completed", mode: "live",
  order: { status: "paid", amount: 1700, currency: "USD" },
  metadata: { ga_client_id: "123456.789012", ga_session_id: "1790000000" },
};

test("a paid live order produces one purchase with the actual amount and browser identifiers", () => {
  const payload = buildGa4Purchase(checkout, sku);
  assert.equal(payload.client_id, "123456.789012");
  assert.deepEqual(payload.events, [{ name: "purchase", params: {
    transaction_id: "ch_paid123", currency: "USD", value: 17,
    items: [{ item_id: sku, price: 17, quantity: 1 }],
    engagement_time_msec: 1, session_id: "1790000000",
  } }]);
  assert.equal(buildGa4Purchase({ ...checkout, order: { ...checkout.order, amount: 525, currency: "JPY" } }, sku).events[0].params.value, 525);
});

test("test, unpaid, incomplete and unattributed checkouts cannot become purchases", () => {
  for (const changed of [
    { mode: "test" }, { status: "open" }, { order: { ...checkout.order, status: "unpaid" } },
    { metadata: {} }, { order: { ...checkout.order, amount: undefined } },
  ]) assert.equal(buildGa4Purchase({ ...checkout, ...changed }, sku), null);
});

test("GA4 delivery is retried after failure and recorded only once after success", async (t) => {
  const sent = new Set();
  const env = {
    CREEM_MODE: "live", GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "test-secret",
    DB: { prepare(sql) {
      return {
        bind(...values) { this.values = values; return this; },
        async first() { return sent.has(this.values[0]) ? { transaction_id: this.values[0] } : null; },
        async run() { sent.add(this.values[0]); },
      };
    } },
  };
  const requests = [];
  let status = 500;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url: String(url), payload: JSON.parse(init.body) });
    return new Response(null, { status });
  });
  await assert.rejects(sendGa4Purchase(env, checkout, sku), /HTTP 500/);
  assert.equal(sent.size, 0);
  status = 204;
  await sendGa4Purchase(env, checkout, sku);
  await sendGa4Purchase(env, checkout, sku);
  assert.equal(requests.length, 2);
  assert.equal(sent.size, 1);
  assert.match(requests[1].url, /measurement_id=G-TEST/);
  assert.equal(requests[1].payload.events[0].params.transaction_id, checkout.id);
});

