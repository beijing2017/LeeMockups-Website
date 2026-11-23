import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
function browser({allowed=true,gpc=false}={}) {
 const storage=new Map([['leemockups-tracking-consent',JSON.stringify({analytics:allowed,advertising:allowed})]]);
 const listeners=new Map();
 const window={setTimeout,clearTimeout,leemockupsGaTagState:'ready',
  addEventListener(name,listener){const group=listeners.get(name)||new Set();group.add(listener);listeners.set(name,group);},
  removeEventListener(name,listener){listeners.get(name)?.delete(listener);},
  dispatchEvent(event){for(const listener of listeners.get(event.type)||[])listener(event);},
 };
 const context=vm.createContext({window,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{globalPrivacyControl:gpc},crypto,Event,URL,URLSearchParams,Date,Promise,process:{env:{NEXT_PUBLIC_GA_ID:'G-LOCAL'}}});
 function load(path,require=()=>{}){const module={exports:{}};context.module=module;context.exports=module.exports;context.require=require;const source=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInContext(`(function(module,exports,require){${source}\n})`,context)(module,module.exports,require);return module.exports;}
 const consent=load('../lib/analytics-consent.ts');const api=load('../lib/marketing-attribution.ts',()=>consent);
 return {api,consent,storage,window};
}
test('delayed tag initialization and asynchronous identifiers are awaited',async()=>{
 const {api,window}=browser();let calls=0;window.leemockupsGaTagState=undefined;
 window.gtag=()=>{throw Error('queued get must wait for the real tag');};
 const timer=setTimeout(()=>{window.gtag=(command,id,field,callback)=>{calls++;setTimeout(()=>callback(field==='client_id'?'123.456':1790000000),10);};window.leemockupsGaTagState='ready';window.dispatchEvent(new Event('leemockups-ga-tag-state'));},60);
 try {const result=await api.readAnalyticsIdentifiers();assert.equal(result.clientId,'123.456');assert.equal(result.sessionId,'1790000000');assert.equal(calls,2);}finally{clearTimeout(timer);}
});
test('failed Google tag load leaves checkout available without an identifier',async()=>{
 const {api,window}=browser();window.leemockupsGaTagState='failed';window.gtag=()=>{throw Error('must not call failed tag');};
 const result=await api.readAnalyticsIdentifiers();assert.equal(result.reason,'tag_load_failed');assert.equal(result.clientId,undefined);
});
test('denied, unknown, advertising refusal and GPC never read or emit identifiers',async()=>{
 for(const options of [{allowed:false},{gpc:true},{}]){
  const {api,storage,window}=browser(options);if(!options.allowed&&!options.gpc)storage.clear();
  if(Object.keys(options).length===0)storage.set('leemockups-tracking-consent',JSON.stringify({analytics:true,advertising:false}));
  let calls=0;window.gtag=()=>calls++;
  const result=await api.readAnalyticsIdentifiers();api.trackEvent('purchase');assert.equal(result.consent,'denied');assert.equal(result.clientId,undefined);assert.equal(calls,0);
 }
});
test('ad blocker timeout allows checkout with a diagnostic and no invented identifier',async()=>{
 const {api,window}=browser();window.gtag=()=>{};
 const result=await api.readAnalyticsIdentifiers();assert.equal(result.reason,'client_id_missing');assert.equal(result.clientId,undefined);
});
test('consent revoked while identifiers are loading discards callback values',async()=>{
 const {api,window,storage}=browser();window.gtag=(command,id,field,callback)=>setTimeout(()=>{storage.clear();callback('123.456');},20);
 const result=await api.readAnalyticsIdentifiers();assert.equal(result.consent,'denied');assert.equal(result.clientId,undefined);
});
test('uninitialized blocked tag returns tag_unavailable instead of blocking payment',async()=>{
 const {api}=browser();const result=await api.readAnalyticsIdentifiers();assert.equal(result.reason,'tag_unavailable');
});

test('production initialization queues standard Arguments, consent before config, then resolves queued get callbacks',async()=>{
 const {api,consent,window}=browser();assert.equal(consent.configureAnalytics('G-LOCAL'),true);
 assert.equal(Object.prototype.toString.call(window.dataLayer[0]),'[object Arguments]');
 assert.deepEqual(Array.from(window.dataLayer[0]).slice(0,2),['consent','default']);
 assert.equal(window.dataLayer.find(entry=>entry[0]==='config')[1],'G-LOCAL');
 const identifiers=api.readAnalyticsIdentifiers();
 for(const command of window.dataLayer){if(command[0]==='get')command[3](command[2]==='client_id'?'123.456':1790000000);}
 const result=await identifiers;assert.equal(result.clientId,'123.456');assert.equal(result.sessionId,'1790000000');
 consent.configureAnalytics('G-LOCAL');assert.equal(window.dataLayer.filter(entry=>entry[0]==='config').length,1);
});
test('denial creates no tag queue; subsequent withdrawal disables tracking without a server queue',()=>{
 const denied=browser({allowed:false});assert.equal(denied.consent.configureAnalytics('G-LOCAL'),false);assert.equal(denied.window.dataLayer,undefined);
 const {api,consent,window,storage}=browser();consent.configureAnalytics('G-LOCAL');storage.clear();consent.configureAnalytics('G-LOCAL');assert.equal(window['ga-disable-G-LOCAL'],true);
 const length=window.dataLayer.length;api.trackEvent('begin_checkout');assert.equal(window.dataLayer.length,length);
});
