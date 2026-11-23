# Simplified GA4 purchase tracking (local changes only)

The signed CREEM checkout.completed handler saves the existing order and
entitlements before attempting GA4. Analytics errors do not invalidate payment,
authorization, redemption, or download permissions.

## Browser and consent

Prepare Google's standard Arguments-based gtag queue and default consent before
loading the Google script. Load it only after the required analytics and advertising
consent. Read client_id and optional session_id with a total three-second budget.
Do not read GA cookies as a workaround or invent an identifier when blocked.
Unexpected identifier-read failures still allow checkout to open.

The Checkout request carries validated identifiers and the explicit consent snapshot
into CREEM metadata. Unknown or denied consent and missing/invalid client_id skip
purchase tracking. Session ID is optional. Privacy preferences stop subsequent
browser tracking; there is no server revocation registry or retrospective deletion
of an event already sent. Server delivery uses consent captured at checkout creation.

## Server delivery and existing deduplication table

Use the signed webhook's checkout and order directly, without re-fetching CREEM.
Require completed checkout, live/prod mode, paid order and valid identifiers.
Send one standard purchase with order.id as transaction_id, order currency, and
actual paid amount excluding separately reported tax. USD 200 cents becomes 2.
If amount_paid is absent, use amount minus discount as the net value. Malformed
supplied amounts are rejected rather than silently replaced.

Reuse ga4_purchase_events(transaction_id, sent_at). No new tables, columns, Cron,
retry switch, queue, leases, or automatic replay are required. A transactional D1
batch reserves both order ID and checkout ID with sent_at=''. This honors legacy
checkout markers and prevents concurrent or repeated webhooks from dispatching
again. The checkout marker also prevents old code from resending after rollback.

After HTTP 2xx, update both markers with the timestamp. HTTP 2xx only means the
request was accepted, not that GA4 validated or ingested it. On HTTP failure,
timeout, or ambiguous response, retain the empty reservation and log a fixed reason.
An empty sent_at means reserved/unconfirmed, never successful ingestion. There
is no automatic retry, including on repeated webhook delivery. A crash after
reservation can lose an event; this is the deliberate at-most-one-attempt tradeoff
for avoiding a retry system. Do not delete markers or replay historical orders.
The marker table contains two identities per new order and is not a sales counter.

Only event type and fixed reason/status are logged. No GA identifiers, customer
information, amounts, credentials, payloads, or response bodies are logged.

## Before any later authorized deployment

- Verify the existing production marker-table schema and preserve its records.
- Keep DB, MOCKUPS, DOWNLOAD_SECRET, CREEM_MODE=live, CREEM API/webhook credentials,
  GA_MEASUREMENT_ID and GA_API_SECRET intact. Match the website build-time
  NEXT_PUBLIC_GA_ID to that measurement ID. Check Secret ownership in GA4 without
  printing its value. A successful HTTP response is not proof of a valid Secret.
- Package ga4-purchase.mjs with the Worker. The local upload workflows include it.
- Deploy Worker and website together, Worker first. An old in-flight checkout may
  lack new consent metadata and safely skip analytics; it must still unlock.
- No additional database migration or scheduled trigger is needed. No production
  configuration, purchase event, or Google Ads setting has been changed locally.

For authorized production validation, use a new $2 purchase after explicitly
allowing tracking. Check purchase access/download, sanitized Worker log, both
nonempty markers, then GA4 purchase transaction_id, value=2 and currency=USD (no
tax case). Inspect Realtime and subsequent reports; do not rely on HTTP 2xx alone.
Do not replay the previously diagnosed real order. Google Ads import configuration
is a separate manual confirmation; a direct purchase need not be ad-attributed.

## Local tests

Tests use synthetic orders, mocked HTTP, in-memory SQLite and the actual
transpiled browser initialization/identifier functions. They do not send to GA4.

    node --test cloudflare/ga4-purchase.test.mjs tests/analytics-identifiers.test.mjs
    npx tsc --noEmit
