const FILES = {
  "mug-v1": "Mug v1-v1.0.0.mockup",
};
const ETSY_REDIRECT_URI =
  "https://leemockups-download.rgbcn-net.workers.dev/etsy/callback";
const ETSY_SCOPES =
  "transactions_r listings_r shops_r";
const PRODUCT_CATALOG_KEY = "private/catalog/products.json";
const REDEEM_ORIGINS = new Set([
  "https://www.leemockups.com",
  "https://leemockups.com",
]);
const CLIENT_DOWNLOADS = {
  "/d/windows": {
    key: "downloads/client/windows/LeeMockups-Windows-1.13.71-Portable.zip",
    fileName: "LeeMockups-Windows-1.13.71-Portable.zip",
  },
  "/d/mac-arm64": {
    key: "downloads/client/macos/LeeMockups-macOS-1.13.71-arm64.zip",
    fileName: "LeeMockups-macOS-1.13.71-arm64.zip",
  },
  "/d/mac-x64": {
    key: "downloads/client/macos/LeeMockups-macOS-1.13.71-x64.zip",
    fileName: "LeeMockups-macOS-1.13.71-x64.zip",
  },
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const clientDownload = CLIENT_DOWNLOADS[url.pathname];
    if (clientDownload) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      }
      const object = await env.MOCKUPS.get(clientDownload.key);
      if (!object) {
        return new Response("Download unavailable", { status: 404 });
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Content-Type", "application/zip");
      headers.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(clientDownload.fileName)}`
      );
      headers.set("Content-Length", String(object.size));
      headers.set("Cache-Control", "no-store");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(request.method === "HEAD" ? null : object.body, {
        status: 200,
        headers,
      });
    }
    const publicMockupKey = /^\/mockups\/(LM-VM-[A-Z]{3}-\d{3})\/\1-(thumb\.webp|preview\.webm)$/.exec(url.pathname)?.[0]?.slice(1);
    if (publicMockupKey) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      }
      const object = await env.MOCKUPS.get(publicMockupKey);
      if (!object) {
        return new Response("Mockup preview unavailable", { status: 404 });
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Content-Type", publicMockupKey.endsWith(".webm") ? "video/webm" : "image/webp");
      headers.set("Cache-Control", "public, max-age=3600");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(request.method === "HEAD" ? null : object.body, {
        status: 200,
        headers,
      });
    }
    if (url.pathname === "/catalog/products.json") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      const object = await env.MOCKUPS.get("public/catalog/products.json");
      if (!object) return new Response(JSON.stringify({ version: 1, products: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=UTF-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" },
      });
      const headers = new Headers();
      headers.set("Content-Type", "application/json; charset=UTF-8");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Cache-Control", "public, max-age=60");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(request.method === "HEAD" ? null : object.body, { status: 200, headers });
    }
    // ==================================================
    // 0. Etsy Webhook - 正式验签版
    //    当前只验签，不写 orders / entitlements
    // ==================================================
    if (url.pathname === "/etsy/webhook") {
      if (request.method === "GET") {
        return jsonResponse({
          ok: true,
          message: "LeeMockups Etsy webhook endpoint is ready",
          mode: "signature-verification",
          secret_configured: Boolean(env.ETSY_WEBHOOK_SECRET),
        });
      }
      if (request.method !== "POST") {
        return jsonResponse(
          {
            ok: false,
            error: "Method not allowed",
          },
          405
        );
      }
      try {
        const rawBody = await request.text();
        const webhookId =
          request.headers.get("webhook-id");
        const webhookTimestamp =
          request.headers.get("webhook-timestamp");
        const webhookSignature =
          request.headers.get("webhook-signature");
        if (
          !webhookId ||
          !webhookTimestamp ||
          !webhookSignature
        ) {
          return jsonResponse(
            {
              ok: false,
              error: "Missing Etsy webhook headers",
            },
            401
          );
        }
        if (!env.ETSY_WEBHOOK_SECRET) {
          console.error(
            "ETSY_WEBHOOK_SECRET is not configured"
          );
          return jsonResponse(
            {
              ok: false,
              error: "Webhook secret is not configured",
            },
            500
          );
        }
        // ----------------------------------------------
        // 防止旧请求被重复重放
        // Etsy 官方建议允许误差最多约 300 秒
        // ----------------------------------------------
        const timestamp =
          Number(webhookTimestamp);
        const now =
          Math.floor(Date.now() / 1000);
        if (
          !Number.isFinite(timestamp) ||
          Math.abs(now - timestamp) > 300
        ) {
          return jsonResponse(
            {
              ok: false,
              error: "Webhook timestamp is stale",
            },
            401
          );
        }
        // ----------------------------------------------
        // 验证 Etsy Webhook 签名
        // ----------------------------------------------
        const signatureValid =
          await verifyEtsyWebhookSignature({
            rawBody,
            webhookId,
            webhookTimestamp,
            webhookSignature,
            secret:
              env.ETSY_WEBHOOK_SECRET,
          });
        if (!signatureValid) {
          console.error(
            "Invalid Etsy webhook signature",
            {
              webhookId,
            }
          );
          return jsonResponse(
            {
              ok: false,
              error: "Invalid webhook signature",
            },
            401
          );
        }
        // ----------------------------------------------
        // 签名通过后才解析 JSON
        // ----------------------------------------------
        let payload;
        try {
          payload =
            JSON.parse(rawBody);
        } catch {
          return jsonResponse(
            {
              ok: false,
              error: "Invalid JSON payload",
            },
            400
          );
        }
        console.log(
          JSON.stringify({
            type: "etsy_webhook_verified",
            webhook_id:
              webhookId,
            event_type:
              payload?.event_type ?? null,
            shop_id:
              payload?.shop_id ?? null,
            resource_url:
              payload?.resource_url ?? null,
          })
        );
        // ----------------------------------------------
        // 当前阶段：
        // 验签成功，但暂时不处理订单
        // ----------------------------------------------
        return jsonResponse({
          ok: true,
          verified: true,
          processed: false,
          event_type:
            payload?.event_type ?? null,
          shop_id:
            payload?.shop_id ?? null,
          message:
            "Etsy webhook signature verified successfully.",
        });
      } catch (error) {
        console.error(
          "Webhook error:",
          error
        );
        return jsonResponse(
          {
            ok: false,
            error:
              String(
                error?.message ||
                error
              ),
          },
          500
        );
      }
    }
    // ==================================================
    // 1. 开始 Etsy OAuth
    // ==================================================
    if (url.pathname === "/etsy/connect") {
      const state =
        randomString(32);
      const codeVerifier =
        randomString(64);
      const codeChallenge =
        await sha256Base64Url(
          codeVerifier
        );
      const now =
        Math.floor(
          Date.now() / 1000
        );
      await env.DB.prepare(
        `DELETE FROM oauth_states
         WHERE created_at < ?`
      )
        .bind(
          now - 15 * 60
        )
        .run();
      await env.DB.prepare(
        `INSERT INTO oauth_states (
          state,
          code_verifier,
          created_at
        )
        VALUES (?, ?, ?)`
      )
        .bind(
          state,
          codeVerifier,
          now
        )
        .run();
      const authUrl =
        new URL(
          "https://www.etsy.com/oauth/connect"
        );
      authUrl.searchParams.set(
        "response_type",
        "code"
      );
      authUrl.searchParams.set(
        "redirect_uri",
        ETSY_REDIRECT_URI
      );
      authUrl.searchParams.set(
        "scope",
        ETSY_SCOPES
      );
      authUrl.searchParams.set(
        "client_id",
        env.ETSY_KEYSTRING
      );
      authUrl.searchParams.set(
        "state",
        state
      );
      authUrl.searchParams.set(
        "code_challenge",
        codeChallenge
      );
      authUrl.searchParams.set(
        "code_challenge_method",
        "S256"
      );
      return Response.redirect(
        authUrl.toString(),
        302
      );
    }
    // ==================================================
    // 2. Etsy OAuth callback
    // ==================================================
    if (
      url.pathname ===
      "/etsy/callback"
    ) {
      const code =
        url.searchParams.get(
          "code"
        );
      const state =
        url.searchParams.get(
          "state"
        );
      const error =
        url.searchParams.get(
          "error"
        );
      if (error) {
        return textResponse(
          `Etsy authorization failed: ${error}`,
          400
        );
      }
      if (!code || !state) {
        return textResponse(
          "Missing Etsy authorization code or state.",
          400
        );
      }
      const savedState =
        await env.DB.prepare(
          `SELECT
            state,
            code_verifier,
            created_at
           FROM oauth_states
           WHERE state = ?`
        )
          .bind(state)
          .first();
      if (!savedState) {
        return textResponse(
          "Invalid or expired Etsy authorization state.",
          403
        );
      }
      const now =
        Math.floor(
          Date.now() / 1000
        );
      if (
        Number(
          savedState.created_at
        ) <
        now - 15 * 60
      ) {
        await env.DB.prepare(
          `DELETE FROM oauth_states
           WHERE state = ?`
        )
          .bind(state)
          .run();
        return textResponse(
          "Etsy authorization session expired. Please try again.",
          403
        );
      }
      const tokenResponse =
        await fetch(
          "https://api.etsy.com/v3/public/oauth/token",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/x-www-form-urlencoded",
            },
            body:
              new URLSearchParams({
                grant_type:
                  "authorization_code",
                client_id:
                  env.ETSY_KEYSTRING,
                redirect_uri:
                  ETSY_REDIRECT_URI,
                code,
                code_verifier:
                  savedState.code_verifier,
              }),
          }
        );
      const tokenData =
        await tokenResponse.json();
      if (
        !tokenResponse.ok
      ) {
        console.error(
          "Etsy token exchange failed:",
          tokenData
        );
        return jsonResponse(
          {
            ok: false,
            message:
              "Failed to connect Etsy.",
            details:
              tokenData,
          },
          500
        );
      }
      await saveEtsyToken(
        env,
        tokenData
      );
      await env.DB.prepare(
        `DELETE FROM oauth_states
         WHERE state = ?`
      )
        .bind(state)
        .run();
      return htmlResponse(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>LeeMockups Etsy Connected</title>
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
          >
        </head>
        <body style="
          font-family:Arial,sans-serif;
          max-width:640px;
          margin:80px auto;
          padding:24px;
          line-height:1.6;
        ">
          <h1>Etsy connected successfully ✓</h1>
          <p>
            Your Etsy shop is now authorized
            for LeeMockups.
          </p>
          <p>
            You can close this page.
          </p>
        </body>
        </html>
      `);
    }
    // ==================================================
    // 3. 测试 OAuth
    // ==================================================
    if (
      url.pathname ===
      "/etsy/test"
    ) {
      try {
        const token =
          await getValidEtsyToken(
            env
          );
        const userId =
          token.access_token
            .split(".")[0];
        return jsonResponse({
          ok: true,
          message:
            "Etsy OAuth token is valid",
          user_id:
            userId,
          scopes:
            token.scope
              ? token.scope
                  .split(" ")
                  .filter(Boolean)
              : [],
          expires_at:
            Number(
              token.expires_at
            ),
          expires_in_seconds:
            Math.max(
              0,
              Number(
                token.expires_at
              ) -
                Math.floor(
                  Date.now() /
                    1000
                )
            ),
        });
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            error:
              String(
                error?.message ||
                error
              ),
          },
          500
        );
      }
    }
    // ==================================================
    // 4. 获取 Etsy Shop
    // ==================================================
    if (
      url.pathname ===
      "/etsy/shop"
    ) {
      try {
        const token =
          await getValidEtsyToken(
            env
          );
        const userId =
          token.access_token
            .split(".")[0];
        const response =
          await fetch(
            `https://api.etsy.com/v3/application/users/${userId}/shops`,
            {
              headers:
                etsyHeaders(
                  env,
                  token.access_token
                ),
            }
          );
        const data =
          await response.json();
        if (!response.ok) {
          return jsonResponse(
            {
              ok: false,
              status:
                response.status,
              error:
                data,
            },
            response.status
          );
        }
        const shop = {
          shop_id:
            data.shop_id ??
            null,
          user_id:
            data.user_id ??
            Number(userId),
          shop_name:
            data.shop_name ??
            null,
          title:
            data.title ??
            null,
          currency_code:
            data.currency_code ??
            null,
          listing_active_count:
            data.listing_active_count ??
            0,
          digital_listing_count:
            data.digital_listing_count ??
            0,
        };
        if (
          !shop.shop_id
        ) {
          return jsonResponse(
            {
              ok: false,
              error:
                "No Etsy shop_id returned.",
            },
            500
          );
        }
        await saveShop(
          env,
          shop
        );
        return jsonResponse({
          ok: true,
          message:
            "Etsy shop loaded and saved successfully",
          shop,
        });
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            error:
              String(
                error?.message ||
                error
              ),
          },
          500
        );
      }
    }
    // ==================================================
    // 5. 获取 Etsy Listings
    // ==================================================
    if (
      url.pathname ===
      "/etsy/listings"
    ) {
      try {
        const token =
          await getValidEtsyToken(
            env
          );
        const shop =
          await getSavedShop(
            env
          );
        if (
          !shop?.shop_id
        ) {
          return jsonResponse(
            {
              ok: false,
              error:
                "Etsy shop is not saved yet. Open /etsy/shop first.",
            },
            400
          );
        }
        const listingsUrl =
          new URL(
            `https://api.etsy.com/v3/application/shops/${shop.shop_id}/listings`
          );
        listingsUrl.searchParams.set(
          "limit",
          "100"
        );
        listingsUrl.searchParams.set(
          "includes",
          "Images"
        );
        const response =
          await fetch(
            listingsUrl.toString(),
            {
              headers:
                etsyHeaders(
                  env,
                  token.access_token
                ),
            }
          );
        const data =
          await response.json();
        if (!response.ok) {
          return jsonResponse(
            {
              ok: false,
              status:
                response.status,
              error:
                data,
            },
            response.status
          );
        }
        const rawListings =
          Array.isArray(
            data.results
          )
            ? data.results
            : [];
        const listings =
          rawListings.map(
            (listing) => ({
              listing_id:
                listing.listing_id,
              title:
                listing.title,
              state:
                listing.state,
              url:
                listing.url,
              price:
                listing.price ??
                null,
              quantity:
                listing.quantity ??
                null,
              is_digital:
                listing.is_digital ??
                null,
              created_timestamp:
                listing.creation_timestamp ??
                null,
              updated_timestamp:
                listing.last_modified_timestamp ??
                null,
              image:
                Array.isArray(
                  listing.images
                ) &&
                listing.images.length
                  ? {
                      listing_image_id:
                        listing.images[0]
                          .listing_image_id ??
                        null,
                      url_75x75:
                        listing.images[0]
                          .url_75x75 ??
                        null,
                      url_170x135:
                        listing.images[0]
                          .url_170x135 ??
                        null,
                      url_570xN:
                        listing.images[0]
                          .url_570xN ??
                        null,
                      url_fullxfull:
                        listing.images[0]
                          .url_fullxfull ??
                        null,
                    }
                  : null,
            })
          );
        return jsonResponse({
          ok: true,
          shop_id:
            shop.shop_id,
          shop_name:
            shop.shop_name,
          count:
            data.count ??
            listings.length,
          returned:
            listings.length,
          listings,
        });
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            error:
              String(
                error?.message ||
                error
              ),
          },
          500
        );
      }
    }
    // ==================================================
    // 6. 获取 Etsy Orders
    // ==================================================
    if (
      url.pathname ===
      "/etsy/orders"
    ) {
      try {
        const token =
          await getValidEtsyToken(
            env
          );
        const shop =
          await getSavedShop(
            env
          );
        if (
          !shop?.shop_id
        ) {
          return jsonResponse(
            {
              ok: false,
              error:
                "Etsy shop is not saved yet. Open /etsy/shop first.",
            },
            400
          );
        }
        const ordersUrl =
          new URL(
            `https://api.etsy.com/v3/application/shops/${shop.shop_id}/receipts`
          );
        ordersUrl.searchParams.set(
          "limit",
          "100"
        );
        const response =
          await fetch(
            ordersUrl.toString(),
            {
              headers:
                etsyHeaders(
                  env,
                  token.access_token
                ),
            }
          );
        const data =
          await response.json();
        if (!response.ok) {
          return jsonResponse(
            {
              ok: false,
              status:
                response.status,
              error:
                data,
            },
            response.status
          );
        }
        const rawReceipts =
          Array.isArray(
            data.results
          )
            ? data.results
            : [];
        const orders =
          rawReceipts.map(
            (receipt) => ({
              receipt_id:
                receipt.receipt_id ??
                null,
              receipt_type:
                receipt.receipt_type ??
                null,
              seller_user_id:
                receipt.seller_user_id ??
                null,
              buyer_user_id:
                receipt.buyer_user_id ??
                null,
              name:
                receipt.name ??
                null,
              status:
                receipt.status ??
                null,
              is_paid:
                receipt.is_paid ??
                null,
              is_shipped:
                receipt.is_shipped ??
                null,
              create_timestamp:
                receipt.create_timestamp ??
                null,
              update_timestamp:
                receipt.update_timestamp ??
                null,
              grandtotal:
                receipt.grandtotal ??
                null,
              currency_code:
                receipt.grandtotal
                  ?.currency_code ??
                null,
              transactions:
                Array.isArray(
                  receipt.transactions
                )
                  ? receipt.transactions.map(
                      (
                        transaction
                      ) => ({
                        transaction_id:
                          transaction.transaction_id ??
                          null,
                        listing_id:
                          transaction.listing_id ??
                          null,
                        title:
                          transaction.title ??
                          null,
                        quantity:
                          transaction.quantity ??
                          null,
                        price:
                          transaction.price ??
                          null,
                      })
                    )
                  : [],
            })
          );
        return jsonResponse({
          ok: true,
          shop_id:
            shop.shop_id,
          shop_name:
            shop.shop_name,
          count:
            data.count ??
            orders.length,
          returned:
            orders.length,
          orders,
        });
      } catch (error) {
        return jsonResponse(
          {
            ok: false,
            error:
              String(
                error?.message ||
                error
              ),
          },
          500
        );
      }
    }
    // ==================================================
    // 7. Etsy 订单自助兑换
    // ==================================================
    if (url.pathname === "/redeem") {
      const origin = request.headers.get("origin") || "";
      const corsHeaders = redeemCorsHeaders(origin);
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      if (request.method !== "POST") {
        return redeemJson({ ok: false, error: "Method not allowed." }, 405, corsHeaders);
      }
      try {
        const contentLength = Number(request.headers.get("content-length") || 0);
        if (contentLength > 4096) return redeemJson({ ok: false, error: "Request is too large." }, 413, corsHeaders);
        const body = await request.json();
        const orderNumber = String(body?.orderNumber || "").trim();
        const email = normalizeEmail(body?.email);
        if (!/^\d{6,20}$/.test(orderNumber) || (body?.email && !email)) {
          return redeemJson({ ok: false, error: "Enter a valid Etsy order number and email address." }, 400, corsHeaders);
        }
        const shop = await getSavedShop(env);
        if (!shop?.shop_id) throw new Error("Etsy shop is not connected.");
        let token = await getValidEtsyToken(env);
        let receiptResponse = await fetch(
          `https://api.etsy.com/v3/application/shops/${shop.shop_id}/receipts/${orderNumber}`,
          { headers: etsyHeaders(env, token.access_token) }
        );
        if (receiptResponse.status === 401) {
          token = await getValidEtsyToken(env, true);
          receiptResponse = await fetch(
            `https://api.etsy.com/v3/application/shops/${shop.shop_id}/receipts/${orderNumber}`,
            { headers: etsyHeaders(env, token.access_token) }
          );
        }
        if (receiptResponse.status === 404) return redeemNotFound(corsHeaders);
        const receipt = await receiptResponse.json();
        if (!receiptResponse.ok) throw new Error(`Etsy order lookup failed (${receiptResponse.status}).`);
        const receiptEmail = normalizeEmail(receipt.buyer_email || receipt.payment_email);
        if (!receipt.is_paid || (email && receiptEmail && !safeEqual(email, receiptEmail))) return redeemNotFound(corsHeaders);
        const catalog = await readProductCatalog(env);
        const listingIds = new Set((receipt.transactions || []).map((item) => String(item.listing_id || "")).filter(Boolean));
        const products = catalog.products.filter((item) => listingIds.has(String(item.listingId)));
        if (!products.length) return redeemNotFound(corsHeaders);
        const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
        const downloads = [];
        for (const product of products) {
          const id = String(product.sku || "");
          if (!/^LM-VM-[A-Z]{3}-\d{3}$/.test(id)) continue;
          const fileKey = product.fileKey || `private/mockups/${id}/${id}.mockup`;
          if (!(await env.MOCKUPS.head(fileKey))) continue;
          const signature = await createSignature(`${id}:${expiresAt}`, env.DOWNLOAD_SECRET);
          downloads.push({ sku: id, name: product.name || id, url: `${url.origin}/d/${encodeURIComponent(id)}?exp=${expiresAt}&sig=${signature}` });
        }
        if (!downloads.length) return redeemJson({ ok: false, code: "FILE_PENDING", error: "Your purchase is verified, but the download is still being prepared. Please try again shortly." }, 409, corsHeaders);
        return redeemJson({ ok: true, expiresAt, downloads }, 200, corsHeaders);
      } catch (error) {
        console.error(JSON.stringify({ type: "redeem_error", message: String(error?.message || error) }));
        return redeemJson({ ok: false, error: "We could not verify the order right now. Please try again shortly." }, 503, corsHeaders);
      }
    }
    // ==================================================
    // 8. 私有 Mockup 下载
    // ==================================================
    if (
      url.pathname.startsWith(
        "/d/"
      )
    ) {
      const id =
        decodeURIComponent(
          url.pathname.slice(3)
        );
      const exp =
        Number(
          url.searchParams.get(
            "exp"
          )
        );
      const sig =
        url.searchParams.get(
          "sig"
        );
      if (
        !id ||
        !exp ||
        !sig
      ) {
        return new Response(
          "Invalid download link.",
          {
            status: 400,
          }
        );
      }
      const now =
        Math.floor(
          Date.now() / 1000
        );
      if (
        exp < now
      ) {
        return new Response(
          "This download link has expired.",
          {
            status: 403,
          }
        );
      }
      if (
        exp >
        now +
          24 * 60 * 60
      ) {
        return new Response(
          "Invalid expiration time.",
          {
            status: 403,
          }
        );
      }
      const expectedSig =
        await createSignature(
          `${id}:${exp}`,
          env.DOWNLOAD_SECRET
        );
      if (
        !safeEqual(
          sig,
          expectedSig
        )
      ) {
        return new Response(
          "Invalid download signature.",
          {
            status: 403,
          }
        );
      }
      const objectKey = FILES[id] || (/^LM-VM-[A-Z]{3}-\d{3}$/.test(id) ? `private/mockups/${id}/${id}.mockup` : null);
      if (!objectKey) {
        return new Response(
          "Mockup not found.",
          {
            status: 404,
          }
        );
      }
      const object =
        await env.MOCKUPS.get(
          objectKey
        );
      if (!object) {
        return new Response(
          "File not found in storage.",
          {
            status: 404,
          }
        );
      }
      const headers =
        new Headers();
      object.writeHttpMetadata(
        headers
      );
      headers.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(
          objectKey
        )}`
      );
      headers.set(
        "Cache-Control",
        "private, no-store"
      );
      return new Response(
        object.body,
        {
          headers,
        }
      );
    }
    return textResponse(
      "LeeMockups private download service"
    );
  },
};
// ==================================================
// Etsy Webhook signature verification
// ==================================================
async function verifyEtsyWebhookSignature({
  rawBody,
  webhookId,
  webhookTimestamp,
  webhookSignature,
  secret,
}) {
  if (
    typeof secret !==
      "string" ||
    !secret.startsWith(
      "whsec_"
    )
  ) {
    throw new Error(
      "Invalid Etsy webhook secret format."
    );
  }
  const secretBase64 =
    secret.substring(
      "whsec_".length
    );
  const secretBytes =
    base64ToBytes(
      secretBase64
    );
  const signedContent =
    `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const key =
    await crypto.subtle.importKey(
      "raw",
      secretBytes,
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
  const signatureBuffer =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder()
        .encode(
          signedContent
        )
    );
  const expectedSignature =
    bytesToBase64(
      new Uint8Array(
        signatureBuffer
      )
    );
  /*
   * Etsy 文档说明 webhook-signature
   * 可能包含一个或多个签名。
   *
   * 为兼容类似：
   * abc123
   * v1,abc123
   * v1,abc123 v1,def456
   * 我们都提取出来比较。
   */
  const candidates =
    webhookSignature
      .split(/\s+/)
      .flatMap((entry) => {
        const parts =
          entry.split(",");
        return [
          entry,
          parts[
            parts.length - 1
          ],
        ];
      })
      .filter(Boolean);
  for (
    const candidate
    of candidates
  ) {
    if (
      safeEqual(
        candidate,
        expectedSignature
      )
    ) {
      return true;
    }
  }
  return false;
}
// ==================================================
// Etsy API Headers
// ==================================================
function etsyHeaders(
  env,
  accessToken
) {
  return {
    "x-api-key":
      `${env.ETSY_KEYSTRING}:${env.ETSY_SHARED_SECRET}`,
    "Authorization":
      `Bearer ${accessToken}`,
  };
}
// ==================================================
// 读取已保存 Shop
// ==================================================
async function getSavedShop(
  env
) {
  return await env.DB.prepare(
    `SELECT
      shop_id,
      user_id,
      shop_name,
      title,
      currency_code,
      listing_active_count,
      digital_listing_count
     FROM etsy_shop
     WHERE id = 1`
  ).first();
}
// ==================================================
// 保存 Etsy Shop
// ==================================================
async function saveShop(
  env,
  shop
) {
  await env.DB.prepare(
    `INSERT INTO etsy_shop (
      id,
      shop_id,
      user_id,
      shop_name,
      title,
      currency_code,
      listing_active_count,
      digital_listing_count,
      created_at,
      updated_at
    )
    VALUES (
      1,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(id)
    DO UPDATE SET
      shop_id =
        excluded.shop_id,
      user_id =
        excluded.user_id,
      shop_name =
        excluded.shop_name,
      title =
        excluded.title,
      currency_code =
        excluded.currency_code,
      listing_active_count =
        excluded.listing_active_count,
      digital_listing_count =
        excluded.digital_listing_count,
      updated_at =
        CURRENT_TIMESTAMP`
  )
    .bind(
      shop.shop_id,
      shop.user_id,
      shop.shop_name,
      shop.title,
      shop.currency_code,
      shop.listing_active_count,
      shop.digital_listing_count
    )
    .run();
}
// ==================================================
// Etsy Token 管理
// ==================================================
async function getValidEtsyToken(
  env,
  forceRefresh = false
) {
  let token =
    await env.DB.prepare(
      `SELECT
        access_token,
        refresh_token,
        token_type,
        scope,
        expires_at
       FROM etsy_auth
       WHERE id = 1`
    ).first();
  if (!token) {
    throw new Error(
      "Etsy is not connected."
    );
  }
  const now =
    Math.floor(
      Date.now() / 1000
    );
  if (
    !forceRefresh &&
    Number(
      token.expires_at
    ) >
    now + 5 * 60
  ) {
    return token;
  }
  const response =
    await fetch(
      "https://api.etsy.com/v3/public/oauth/token",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/x-www-form-urlencoded",
        },
        body:
          new URLSearchParams({
            grant_type:
              "refresh_token",
            client_id:
              env.ETSY_KEYSTRING,
            refresh_token:
              token.refresh_token,
          }),
      }
    );
  const data =
    await response.json();
  if (!response.ok) {
    throw new Error(
      "Failed to refresh Etsy token."
    );
  }
  await saveEtsyToken(
    env,
    data
  );
  return await env.DB.prepare(
    `SELECT
      access_token,
      refresh_token,
      token_type,
      scope,
      expires_at
     FROM etsy_auth
     WHERE id = 1`
  ).first();
}
// ==================================================
// 保存 Etsy Token
// ==================================================
async function saveEtsyToken(
  env,
  tokenData
) {
  const expiresAt =
    Math.floor(
      Date.now() / 1000
    ) +
    Number(
      tokenData.expires_in ||
        3600
    );
  await env.DB.prepare(
    `INSERT INTO etsy_auth (
      id,
      access_token,
      refresh_token,
      token_type,
      scope,
      expires_at,
      created_at,
      updated_at
    )
    VALUES (
      1,
      ?,
      ?,
      ?,
      ?,
      ?,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(id)
    DO UPDATE SET
      access_token =
        excluded.access_token,
      refresh_token =
        excluded.refresh_token,
      token_type =
        excluded.token_type,
      scope =
        excluded.scope,
      expires_at =
        excluded.expires_at,
      updated_at =
        CURRENT_TIMESTAMP`
  )
    .bind(
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.token_type ||
        "Bearer",
      tokenData.scope || "",
      expiresAt
    )
    .run();
}
// ==================================================
// Helpers
// ==================================================
function randomString(
  length = 64
) {
  const bytes =
    new Uint8Array(
      length
    );
  crypto.getRandomValues(
    bytes
  );
  return bytesToBase64Url(
    bytes
  ).slice(
    0,
    length
  );
}
async function sha256Base64Url(
  value
) {
  const bytes =
    new TextEncoder()
      .encode(value);
  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      bytes
    );
  return bytesToBase64Url(
    new Uint8Array(
      hash
    )
  );
}
async function createSignature(
  message,
  secret
) {
  if (!secret) {
    throw new Error(
      "DOWNLOAD_SECRET is not configured."
    );
  }
  const encoder =
    new TextEncoder();
  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        secret
      ),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(
        message
      )
    );
  return bytesToBase64Url(
    new Uint8Array(
      signature
    )
  );
}
function base64ToBytes(
  base64
) {
  let normalized =
    base64
      .replace(/-/g, "+")
      .replace(/_/g, "/");
  while (
    normalized.length %
      4 !==
    0
  ) {
    normalized += "=";
  }
  const binary =
    atob(normalized);
  const bytes =
    new Uint8Array(
      binary.length
    );
  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(
        i
      );
  }
  return bytes;
}
function bytesToBase64(
  bytes
) {
  let binary = "";
  for (
    const byte of bytes
  ) {
    binary +=
      String.fromCharCode(
        byte
      );
  }
  return btoa(
    binary
  );
}
function bytesToBase64Url(
  bytes
) {
  return bytesToBase64(
    bytes
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function safeEqual(
  a,
  b
) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    a.length !== b.length
  ) {
    return false;
  }
  let result = 0;
  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }
  return result === 0;
}
function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
async function readProductCatalog(env) {
  const object = await env.MOCKUPS.get(PRODUCT_CATALOG_KEY);
  if (!object) return { products: [] };
  const catalog = await object.json();
  return { products: Array.isArray(catalog?.products) ? catalog.products : [] };
}
function redeemCorsHeaders(origin) {
  const headers = new Headers({
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "cache-control": "no-store",
    "vary": "Origin",
  });
  if (REDEEM_ORIGINS.has(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
    headers.set("access-control-allow-origin", origin);
  }
  return headers;
}
function redeemJson(data, status, headers) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json; charset=UTF-8");
  return new Response(JSON.stringify(data), { status, headers: responseHeaders });
}
function redeemNotFound(headers) {
  return redeemJson({ ok: false, error: "We could not match a paid Etsy order with those details. Check the order number and the email used at checkout." }, 404, headers);
}
function textResponse(
  text,
  status = 200
) {
  return new Response(
    text,
    {
      status,
      headers: {
        "content-type":
          "text/plain; charset=UTF-8",
        "cache-control":
          "no-store",
      },
    }
  );
}
function htmlResponse(
  html,
  status = 200
) {
  return new Response(
    html,
    {
      status,
      headers: {
        "content-type":
          "text/html; charset=UTF-8",
        "cache-control":
          "no-store",
      },
    }
  );
}
function jsonResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=UTF-8",
        "cache-control":
          "no-store",
      },
    }
  );
}
