"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { readAttribution, trackEvent } from "@/lib/marketing-attribution";
import { openPurchasedComposer } from "@/lib/browser-composer";

type DownloadItem={sku:string;name:string;url:string};
type CheckoutEvent={name?:string;data?:{transaction_id?:string;customer?:{email?:string|null}}};
type PurchaseRecord={transactionId:string;claimToken:string;email?:string};
const listeners=new Set<(event:CheckoutEvent)=>void>();
let paddlePromise:Promise<Paddle|undefined>|undefined;
const api="https://downloads.leemockups.com/commerce/redeem";

function paddleClient(token:string){
  paddlePromise ||= initializePaddle({token,eventCallback:(event)=>listeners.forEach((listener)=>listener(event as CheckoutEvent))});
  return paddlePromise;
}
function randomToken(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  return Array.from(bytes,(value)=>value.toString(16).padStart(2,"0")).join("");
}

export function PaddleCheckoutButton({priceId,sku}:{priceId:string;sku:string}){
  const [opening,setOpening]=useState(false);
  const [checking,setChecking]=useState(true);
  const [error,setError]=useState("");
  const [downloads,setDownloads]=useState<DownloadItem[]>([]);
  const downloadLock=useRef(false);
  const storageKey=`leemockups-purchase:${sku}`;

  async function redeem(record:PurchaseRecord,retries=0){
    for(let attempt=0;attempt<=retries;attempt++){
      const response=await fetch(api,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"PADDLE",...record})});
      const body=await response.json();
      if(response.ok){setDownloads(body.downloads||[]);setError("");return body.downloads as DownloadItem[]}
      if(body.code!=="PAYMENT_PENDING"||attempt===retries)throw new Error(body.error||"We could not verify this purchase.");
      await new Promise((resolve)=>setTimeout(resolve,1500*(attempt+1)));
    }
    return [] as DownloadItem[];
  }

  useEffect(()=>{
    const saved=localStorage.getItem(storageKey);
    if(!saved){setChecking(false);return}
    try{redeem(JSON.parse(saved)).catch(()=>localStorage.removeItem(storageKey)).finally(()=>setChecking(false))}
    catch{localStorage.removeItem(storageKey);setChecking(false)}
  },[storageKey]);

  useEffect(()=>{
    const listener=(event:CheckoutEvent)=>{
      if(event.name!=="checkout.completed"||!event.data?.transaction_id)return;
      const pending=localStorage.getItem(`${storageKey}:pending`);
      if(!pending)return;
      const record:PurchaseRecord={...JSON.parse(pending),transactionId:event.data.transaction_id,email:event.data.customer?.email||undefined};
      trackEvent("purchase",{transaction_id:event.data.transaction_id,items:[{item_id:sku}]});
      localStorage.setItem(storageKey,JSON.stringify(record));
      localStorage.removeItem(`${storageKey}:pending`);
      setChecking(true);setError("");
      redeem(record,6).catch((reason)=>setError(reason instanceof Error?reason.message:"Payment received. Download verification is still processing.")).finally(()=>setChecking(false));
    };
    listeners.add(listener);return()=>{listeners.delete(listener)};
  },[storageKey]);

  async function openCheckout(){
    const token=process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if(!token){setError("Checkout is temporarily unavailable.");return}
    setOpening(true);setError("");
    try{
      const claimToken=randomToken();
      const attribution=readAttribution();
      localStorage.setItem(`${storageKey}:pending`,JSON.stringify({claimToken}));
      const paddle=await paddleClient(token);
      if(!paddle)throw new Error("Paddle did not initialize.");
      trackEvent("begin_checkout",{items:[{item_id:sku}]});
      paddle.Checkout.open({items:[{priceId,quantity:1}],customData:{sku,claim_token:claimToken,...(attribution?{utm_source:attribution.source,utm_medium:attribution.medium,utm_campaign:attribution.campaign,utm_content:attribution.content,referrer:attribution.referrer}:{})},settings:{displayMode:"overlay",theme:"light",locale:"en"}});
    }catch{localStorage.removeItem(`${storageKey}:pending`);setError("Checkout could not open. Please try again.")}
    finally{setOpening(false)}
  }

  async function beginCreate(item:DownloadItem){
    if(downloadLock.current)return;
    downloadLock.current=true;setError("");
    try{
      const record=JSON.parse(localStorage.getItem(storageKey)||"null") as PurchaseRecord|null;
      if(!record)throw new Error("Purchase verification expired. Please restore your order.");
      const fresh=await redeem(record);
      openPurchasedComposer(fresh.find((entry)=>entry.sku===item.sku)||item);
    }
    catch(reason){setError(reason instanceof Error?reason.message:"The generator could not open.")}
    finally{downloadLock.current=false}
  }
  if(downloads.length)return <><div className="paddle-downloads purchased">{downloads.map((item)=><button className="button primary purchase-primary purchased" type="button" key={item.sku} onClick={()=>beginCreate(item)}><Play size={17}/>Create video online</button>)}</div>{error&&<small className="checkout-error" role="alert">{error}</small>}</>;
  return <>{checking?<button className="button primary purchase-primary" disabled>Checking purchase…</button>:<button className="button primary purchase-primary" type="button" onClick={openCheckout} disabled={opening}>{opening?"Opening checkout…":"Buy now"}</button>}{error&&<small className="checkout-error" role="alert">{error}</small>}</>;
}
