import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {buildGa4Purchase,sendGa4Purchase,checkoutAnalyticsMetadata,purchaseSkipReason} from './ga4-purchase.mjs';
const sku='LM-VM-FRA-008';
const checkout={id:'ch_local123',status:'completed',mode:'prod',order:{id:'ord_local123',status:'paid',amount:200,amount_paid:200,tax_amount:0,currency:'USD'},metadata:{sku,ga_consent:'granted',ga_client_id:'123.456',ga_session_id:'1790000000'}};
export function database(){
 const sqlite=new DatabaseSync(':memory:');
 const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this;},async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {results:sqlite.prepare(sql).all(...values)};}};},async batch(statements){return Promise.all(statements.map(statement=>statement.run()));}};
 sqlite.exec('CREATE TABLE ga4_purchase_events (transaction_id TEXT PRIMARY KEY,sent_at TEXT NOT NULL)');
 return {sqlite,DB};
}
function setup(t){const {sqlite,DB}=database();t.after(()=>sqlite.close());return {sqlite,env:{DB,CREEM_MODE:'live',GA_MEASUREMENT_ID:'G-LOCAL',GA_API_SECRET:'local-test',CREEM_API_KEY:'local-test'}};}
test('standard purchase uses stable order id and actual paid USD amount',()=>{
 const payload=buildGa4Purchase(checkout,sku),params=payload.events[0].params;
 assert.equal(payload.events[0].name,'purchase');assert.equal(params.transaction_id,'ord_local123');assert.equal(params.value,2);assert.equal(params.currency,'USD');
 assert.equal(buildGa4Purchase({...checkout,order:{...checkout.order,amount:300,amount_paid:250,tax_amount:50,discount_amount:100}},sku).events[0].params.value,2);
 assert.equal(buildGa4Purchase({...checkout,order:{...checkout.order,amount_paid:undefined,amount:300,discount_amount:100}},sku).events[0].params.value,2);
 assert.equal(buildGa4Purchase({...checkout,order:{...checkout.order,currency:'JPY'}},sku).events[0].params.value,200);
 for(const order of [{amount_paid:'200'},{amount_paid:-1},{tax_amount:201},{currency:'ZZZ'}])assert.equal(buildGa4Purchase({...checkout,order:{...checkout.order,...order}},sku),null);
});
test('metadata is allowlisted and never forwards identifiers without explicit consent',()=>{
 assert.deepEqual(checkoutAnalyticsMetadata({clientId:'123.456',sessionId:'123'}),{ga_consent:'denied'});
 assert.deepEqual(checkoutAnalyticsMetadata({consent:'denied',clientId:'123.456'}),{ga_consent:'denied'});
 assert.deepEqual(checkoutAnalyticsMetadata({consent:'granted',clientId:'123.456',sessionId:'123',email:'private'}),{ga_consent:'granted',ga_client_id:'123.456',ga_session_id:'123'});
});
import worker from './leemockups-download.js';
import {createHmac,timingSafeEqual} from 'node:crypto';
async function commerceEnv(t) {
 const {env,sqlite}=setup(t);
 sqlite.exec(`CREATE TABLE commerce_product_mappings (sku TEXT PRIMARY KEY,provider TEXT NOT NULL,product_id TEXT NOT NULL UNIQUE,regular_price_cents INTEGER NOT NULL,launch_price_cents INTEGER NOT NULL,discount_code TEXT,launch_active INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL)`);
 sqlite.prepare('INSERT INTO commerce_product_mappings VALUES (?,?,?,?,?,?,?,?)').run(sku,'CREEM','prod_local',200,200,null,0,'now');
 env.CREEM_WEBHOOK_SECRET='local-fixture';env.DOWNLOAD_SECRET='local-fixture';
 env.MOCKUPS={async get(){return {async json(){return {products:[{sku,name:'Local fixture'}]};}};},async head(){return {};}};
 // Cloudflare exposes this WebCrypto extension; Node uses its equivalent here.
 const previous=crypto.subtle.timingSafeEqual;
 crypto.subtle.timingSafeEqual=timingSafeEqual;
 t.after(()=>{if(previous)crypto.subtle.timingSafeEqual=previous;else delete crypto.subtle.timingSafeEqual;});
 return {env,sqlite};
}
async function webhook(env,event){
 const raw=JSON.stringify(event);const signature=createHmac('sha256',env.CREEM_WEBHOOK_SECRET).update(raw).digest('hex');
 return worker.fetch(new Request('https://downloads.leemockups.com/creem/webhook',{method:'POST',headers:{'creem-signature':signature},body:raw}),env,{});
}
test('signed paid webhook saves and unlocks downloads despite GA4 failure and duplicate notification',async t=>{
 const {env,sqlite}=await commerceEnv(t);let sends=0;
 t.mock.method(globalThis,'fetch',async()=>{sends++;return new Response(null,{status:503});});
 const event={id:'evt_local',eventType:'checkout.completed',object:{...checkout,product:{id:'prod_local'},metadata:{...checkout.metadata,claim_token:'b'.repeat(64)}}};
 assert.equal((await webhook(env,event)).status,200);assert.equal((await webhook(env,event)).status,200);assert.equal(sends,1);
 assert.equal(sqlite.prepare('SELECT status FROM commerce_entitlements').get().status,'completed');
 const response=await worker.fetch(new Request('https://downloads.leemockups.com/commerce/redeem',{method:'POST',headers:{origin:'https://www.leemockups.com','content-type':'application/json'},body:JSON.stringify({provider:'CREEM',transactionId:checkout.order.id,claimToken:'b'.repeat(64)})}),env,{});
 assert.equal(response.status,200);const body=await response.json();assert.equal(body.downloads[0].sku,sku);assert.match(body.downloads[0].url,/\/d\/LM-VM-FRA-008/);
});
test('deduplication storage outage cannot break paid webhook authorization',async t=>{
 const {env,sqlite}=await commerceEnv(t);const prepare=env.DB.prepare;
 env.DB.prepare=sql=>{if(sql.startsWith('INSERT OR IGNORE INTO ga4_purchase_events'))throw Error('local diagnostic outage');return prepare(sql);};
 const event={id:'evt_storage',eventType:'checkout.completed',object:{...checkout,product:{id:'prod_local'},metadata:checkout.metadata}};
 assert.equal((await webhook(env,event)).status,200);assert.equal(sqlite.prepare('SELECT status FROM commerce_entitlements').get().status,'completed');
});
test('checkout route passes validated GA metadata and strips denied identifiers',async t=>{
 const {env}=await commerceEnv(t);const sent=[];
 t.mock.method(globalThis,'fetch',async(url,init)=>{sent.push(JSON.parse(init.body));return Response.json({checkout_url:'https://checkout.creem.io/local'});});
 for(const consent of ['granted','denied']){
 const response=await worker.fetch(new Request('https://downloads.leemockups.com/creem/checkout',{method:'POST',headers:{origin:'https://www.leemockups.com','content-type':'application/json'},body:JSON.stringify({sku,claimToken:'b'.repeat(64),analytics:{consent,clientId:'123.456',sessionId:'123'}})}),env,{});assert.equal(response.status,200);
 }
 assert.equal(sent[0].metadata.ga_client_id,'123.456');assert.equal(sent[0].metadata.ga_session_id,'123');assert.equal(sent[1].metadata.ga_client_id,undefined);assert.equal(sent[1].metadata.ga_consent,'denied');
});

test('normal delivery writes existing markers without creating new tables',async t=>{
 const {env,sqlite}=setup(t);const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();let payload;
 t.mock.method(globalThis,'fetch',async(url,init)=>{payload=JSON.parse(init.body);return new Response(null,{status:204});});
 await sendGa4Purchase(env,checkout,sku);
 assert.equal(payload.events[0].params.transaction_id,checkout.order.id);assert.equal(payload.events[0].params.value,2);
 const markers=sqlite.prepare('SELECT * FROM ga4_purchase_events').all();assert.equal(markers.length,2);assert.ok(markers.every(r=>!isNaN(Date.parse(r.sent_at))));
 assert.deepEqual(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all(),tables);
});
test('parallel and repeated webhooks make one HTTP attempt; legacy checkout marker prevents resend',async t=>{
 const {env,sqlite}=setup(t);let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,10));return new Response(null,{status:204});});
 await Promise.all(Array.from({length:10},()=>sendGa4Purchase(env,checkout,sku)));await sendGa4Purchase(env,checkout,sku);assert.equal(calls,1);
 sqlite.exec('DELETE FROM ga4_purchase_events');sqlite.prepare('INSERT INTO ga4_purchase_events VALUES (?,?)').run(checkout.id,'legacy');
 await sendGa4Purchase(env,checkout,sku);assert.equal(calls,1);
});
test('missing ID, denied/unknown consent, test/unpaid and missing configuration never send or reserve',async t=>{
 const {env,sqlite}=setup(t);let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('must not send');});
 for(const changed of [{metadata:{sku,ga_consent:'granted'}},{metadata:{...checkout.metadata,ga_consent:'denied'}},{metadata:{sku}},{mode:'test'},{order:{...checkout.order,status:'unpaid'}}])await sendGa4Purchase(env,{...checkout,...changed},sku);
 delete env.GA_API_SECRET;await sendGa4Purchase(env,checkout,sku);assert.equal(calls,0);assert.equal(sqlite.prepare('SELECT count(*) AS n FROM ga4_purchase_events').get().n,0);
 assert.equal(purchaseSkipReason({...checkout,metadata:{sku,ga_consent:'granted'}},sku),'client_id_missing');
});
test('HTTP failure and ambiguous network error retain reservation without automatic retries or sensitive logs',async t=>{
 for(const networkFailure of [false,true]){
  const {env,sqlite}=setup(t);let calls=0;const logs=[];
  t.mock.method(console,'error',message=>logs.push(message));
  t.mock.method(globalThis,'fetch',async()=>{calls++;if(networkFailure)throw Error('local-sensitive-fixture');return new Response(null,{status:503});});
  await sendGa4Purchase(env,checkout,sku);await sendGa4Purchase(env,checkout,sku);assert.equal(calls,1);
  assert.ok(sqlite.prepare('SELECT * FROM ga4_purchase_events').all().every(r=>r.sent_at===''));
  assert.match(logs[0],networkFailure?/network_error/:/http_503/);assert.ok(!logs.join('').includes('local-sensitive-fixture'));
 }
});
test('session ID is optional and malformed values never enter GA4 payload',()=>{
 const payload=buildGa4Purchase({...checkout,metadata:{...checkout.metadata,ga_session_id:undefined}},sku);
 assert.equal(payload.events[0].params.session_id,undefined);assert.equal(payload.events[0].name,'purchase');
});

test('a normal paid webhook reports purchase once and preserves preexisting orders and redemption',async t=>{
 const {env,sqlite}=await commerceEnv(t);let sends=0;
 t.mock.method(globalThis,'fetch',async()=>{sends++;return new Response(null,{status:204});});
 const old={id:'evt_older',eventType:'checkout.completed',object:{...checkout,id:'ch_older',order:{...checkout.order,id:'ord_older'},product:{id:'prod_local'},metadata:{sku,claim_token:'c'.repeat(64)}}};
 assert.equal((await webhook(env,old)).status,200);assert.equal(sends,0);
 const original=sqlite.prepare("SELECT * FROM commerce_entitlements WHERE transaction_id='ch_older'").get();
 const current={id:'evt_new',eventType:'checkout.completed',object:{...checkout,product:{id:'prod_local'},metadata:{...checkout.metadata,claim_token:'b'.repeat(64)}}};
 assert.equal((await webhook(env,current)).status,200);assert.equal((await webhook(env,current)).status,200);assert.equal(sends,1);
 assert.deepEqual(sqlite.prepare("SELECT * FROM commerce_entitlements WHERE transaction_id='ch_older'").get(),original);
 for(const [transactionId,claimToken] of [['ord_older','c'.repeat(64)],[checkout.order.id,'b'.repeat(64)]]){
  const response=await worker.fetch(new Request('https://downloads.leemockups.com/commerce/redeem',{method:'POST',headers:{origin:'https://www.leemockups.com','content-type':'application/json'},body:JSON.stringify({provider:'CREEM',transactionId,claimToken})}),env,{});
  assert.equal(response.status,200);assert.equal((await response.json()).downloads[0].sku,sku);
 }
});
