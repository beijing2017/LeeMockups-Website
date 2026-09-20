"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { readAttribution, trackEvent } from "@/lib/marketing-attribution";

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
  const storageKey=`leemockups-purchase:${sku}`;

  async function redeem(record:PurchaseRecord,retries=0){
    for(let attempt=0;attempt<=retries;attempt++){
      const response=await fetch(api,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"PADDLE",...record})});
      const body=await response.json();
      if(response.ok){setDownloads(body.downloads||[]);setError("");return true}
      if(body.code!=="PAYMENT_PENDING"||attempt===retries)throw new Error(body.error||"We could not verify this purchase.");
      await new Promise((resolve)=>setTimeout(resolve,1500*(attempt+1)));
    }
    return false;
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

  if(downloads.length)return <div className="paddle-downloads purchased">{downloads.map((item)=><a className="button primary purchase-primary purchased" key={item.sku} href={item.url} onClick={()=>trackEvent("file_download",{item_id:item.sku})}><Download size={17}/>Download mockup</a>)}</div>;
  return <>{checking?<button className="button primary purchase-primary" disabled>Checking purchase…</button>:<button className="button primary purchase-primary" type="button" onClick={openCheckout} disabled={opening}>{opening?"Opening checkout…":"Buy now"}</button>}{error&&<small className="checkout-error" role="alert">{error}</small>}<Link className="mockup-existing-download" href="/order-download/">Already purchased? Restore download</Link></>;
}
