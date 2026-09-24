import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";

const token = "local-test-admin-token";
const hash = createHash("sha256").update(token).digest("base64url");
const source = fs.readFileSync(new URL("../cloudflare/leemockups-download.js", import.meta.url), "utf8")
  .replace(/const ANALYTICS_ACCESS_HASH = "[^"]+";/, `const ANALYTICS_ACCESS_HASH = "${hash}";`);
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

function environment(missingDiscount = false, missingMapping = false) {
  const updates = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) { updates.push({ sql, values }); return this; },
        async all() { return { results: missingMapping ? [] : [{ sku: "LM-VM-MUG-001", discount_code: missingDiscount ? null : "LAUNCH" }, { sku: "LM-VM-MUG-003", discount_code: "LAUNCH" }] }; },
        async run() { return { meta: { changes: 2 } }; },
      };
    },
  };
  return { DB: db, updates };
}

async function request(env, launchActive, authorized = true) {
  return worker.fetch(new Request("https://downloads.leemockups.com/admin/creem-launch-pricing", {
    method: "POST",
    headers: { "content-type": "application/json", ...(authorized ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ launchActive, skus: ["LM-VM-MUG-001", "LM-VM-MUG-003"] }),
  }), env, {});
}

test("global launch switch requires admin authorization", async () => {
  assert.equal((await request(environment(), false, false)).status, 401);
});

test("turning off the launch offer updates Creem checkout mappings", async () => {
  const env = environment();
  const response = await request(env, false);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, launchActive: false, products: 2 });
  assert.equal(env.updates.length, 1);
  assert.equal(env.updates[0].values[0], 0);
});

test("turning the offer back on refuses mappings without discount codes", async () => {
  const env = environment(true);
  assert.equal((await request(env, true)).status, 409);
  assert.equal(env.updates.length, 0);
});

test("missing published product mappings stop a global price change", async () => {
  const env = environment(false, true);
  assert.equal((await request(env, false)).status, 409);
  assert.equal(env.updates.length, 0);
});
