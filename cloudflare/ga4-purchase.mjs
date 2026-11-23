export function checkoutAnalyticsMetadata(analytics) {
  const allowed = analytics?.consent === 'granted';
  const client = String(analytics?.clientId || '').trim();
  const session = String(analytics?.sessionId || '').trim();
  return {
    ga_consent: allowed ? 'granted' : 'denied',
    ...(allowed && /^\d+\.\d+$/.test(client) && client.length <= 64 ? {ga_client_id:client} : {}),
    ...(allowed && /^\d+$/.test(session) && session.length <= 32 ? {ga_session_id:session} : {}),
  };
}

function money(checkout) {
  const order = checkout?.order || {};
  const tax = order.tax_amount ?? 0;
  const discount = order.discount_amount ?? 0;
  // Never silently fall back when a supplied amount_paid is malformed.
  const paid = order.amount_paid ?? (Number.isSafeInteger(order.amount) && Number.isSafeInteger(discount) && discount >= 0 ? order.amount - discount + tax : NaN);
  const amount = paid - tax;
  if (![tax,paid,amount].every(Number.isSafeInteger) || Math.min(tax,paid,amount) < 0) return null;
  const currency = String(order.currency || '').toUpperCase();
  // Only supported CREEM settlement currencies; reject invented three-letter codes.
  if (!['USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','SEK','NOK','DKK','PLN','CZK','HUF','SGD','HKD','CNY','INR','BRL','MXN','KRW','TWD','THB','TRY','ZAR','AED','SAR','ILS'].includes(currency)) return null;
  const digits = new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits;
  return {currency,value:amount / 10 ** digits,tax:tax / 10 ** digits};
}

export function purchaseSkipReason(checkout, sku) {
  if (checkout?.status !== 'completed') return 'checkout_not_completed';
  if (!['live','prod'].includes(checkout?.mode)) return 'checkout_mode_invalid';
  if (checkout?.order?.status !== 'paid') return 'order_not_paid';
  if (!/^ch_[A-Za-z0-9]+$/.test(checkout?.id || '')) return 'checkout_id_invalid';
  if (!/^ord_[A-Za-z0-9]+$/.test(checkout?.order?.id || '')) return 'order_id_missing';
  if (checkout.metadata?.ga_consent !== 'granted') return checkout.metadata?.ga_consent === 'denied' ? 'consent_denied' : 'consent_unknown';
  if (!checkout.metadata?.ga_client_id) return 'client_id_missing';
  if (!/^\d+\.\d+$/.test(String(checkout.metadata.ga_client_id)) || String(checkout.metadata.ga_client_id).length > 64) return 'client_id_invalid';
  if (!/^LM-VM-[A-Z]{3}-\d{3}$/.test(sku)) return 'sku_invalid';
  if (!/^[A-Z]{3}$/.test(String(checkout.order.currency || '').toUpperCase())) return 'currency_invalid';
  if (!money(checkout)) return 'amount_or_currency_invalid';
  return null;
}

export function buildGa4Purchase(checkout, sku) {
  if (purchaseSkipReason(checkout,sku)) return null;
  const {currency,value,tax} = money(checkout);
  const session = String(checkout.metadata.ga_session_id || '');
  return {
    client_id:String(checkout.metadata.ga_client_id),
    consent:{ad_user_data:'GRANTED',ad_personalization:'GRANTED'},
    events:[{name:'purchase',params:{
      transaction_id:checkout.order.id,currency,value,
      ...(tax ? {tax} : {}),
      items:[{item_id:sku,price:value,quantity:1}],
      engagement_time_msec:1,
      ...(/^\d+$/.test(session) && session.length <= 32 ? {session_id:session} : {}),
    }}],
  };
}

// Reuse the existing marker table. Empty sent_at means reserved/unconfirmed,
// not successful GA4 ingestion. Keep that marker after failure: no automatic replay.
export async function sendGa4Purchase(env, checkout, sku) {
  if (env.CREEM_MODE !== 'live') return;
  const reason=purchaseSkipReason(checkout,sku);
  if(reason){console.warn(JSON.stringify({type:'ga4_purchase_skipped',reason}));return;}
  if(!/^G-[A-Z0-9]+$/.test(env.GA_MEASUREMENT_ID || '') || !env.GA_API_SECRET){
    console.warn(JSON.stringify({type:'ga4_purchase_skipped',reason:'not_configured'}));return;
  }
  const orderId=checkout.order.id, checkoutId=checkout.id;
  // D1 batch is transactional. Reserve both identities, honoring old markers and
  // allowing a rollback to the old checkout-based sender without duplicate sends.
  const reserved=await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO ga4_purchase_events (transaction_id,sent_at)
      SELECT ?, '' WHERE NOT EXISTS (SELECT 1 FROM ga4_purchase_events WHERE transaction_id IN (?, ?))`)
      .bind(orderId,orderId,checkoutId),
    env.DB.prepare(`INSERT OR IGNORE INTO ga4_purchase_events (transaction_id,sent_at)
      SELECT ?, '' WHERE EXISTS (SELECT 1 FROM ga4_purchase_events WHERE transaction_id=? AND sent_at='')`)
      .bind(checkoutId,orderId),
  ]);
  if(reserved[0].meta.changes !== 1)return;
  const endpoint=new URL('https://www.google-analytics.com/mp/collect');
  endpoint.searchParams.set('measurement_id',env.GA_MEASUREMENT_ID);
  endpoint.searchParams.set('api_secret',env.GA_API_SECRET);
  let failure='network_error';
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(buildGa4Purchase(checkout,sku)),signal:AbortSignal.timeout(5000)});
    if(!response.ok){failure=`http_${response.status}`;throw new Error('delivery_failed');}
    failure='marker_write_failed_after_http_2xx';
    await env.DB.prepare(`UPDATE ga4_purchase_events SET sent_at=? WHERE transaction_id IN (?, ?)`)
      .bind(new Date().toISOString(),orderId,checkoutId).run();
    console.info(JSON.stringify({type:'ga4_purchase_sent',reason:'http_2xx_unverified'}));
  }catch{console.error(JSON.stringify({type:'ga4_purchase_failed',reason:failure}));}
}
