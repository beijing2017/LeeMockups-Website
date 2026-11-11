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
