"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { readAttribution, trackEvent } from "@/lib/marketing-attribution";

type DownloadItem={sku:string;name:string;url:string};
type PurchaseRecord={transactionId:string;claimToken:string;email?:string};
const checkoutApi="https://downloads.leemockups.com/creem/checkout";
const redeemApi="https://downloads.leemockups.com/commerce/redeem";

function randomToken(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  return Array.from(bytes,(value)=>value.toString(16).padStart(2,"0")).join("");
}

export function CreemCheckoutButton({productId,sku}:{productId:string;sku:string}){
  const [opening,setOpening]=useState(false),[checking,setChecking]=useState(true),[error,setError]=useState(""),[downloads,setDownloads]=useState<DownloadItem[]>([]);
  const storageKey=`leemockups-purchase:${sku}`;
  async function redeem(record:PurchaseRecord,retries=0){
    for(let attempt=0;attempt<=retries;attempt++){
      const response=await fetch(redeemApi,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({provider:"CREEM",...record})});
      const body=await response.json();
      if(response.ok){setDownloads(body.downloads||[]);setError("");return true}
      if(body.code!=="PAYMENT_PENDING"||attempt===retries)throw new Error(body.error||"We could not verify this purchase.");
      await new Promise((resolve)=>setTimeout(resolve,1500*(attempt+1)));
    }
    return false;
  }
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search),returnedCheckout=params.get("checkout_id")||"",pendingRaw=localStorage.getItem(`${storageKey}:pending`);
    if(params.get("payment")==="success"&&returnedCheckout&&pendingRaw){
      try{
        const pending=JSON.parse(pendingRaw) as {claimToken:string};
        const record:PurchaseRecord={transactionId:returnedCheckout,claimToken:pending.claimToken};
        localStorage.setItem(storageKey,JSON.stringify(record));localStorage.removeItem(`${storageKey}:pending`);
        trackEvent("purchase",{transaction_id:returnedCheckout,items:[{item_id:sku}]});
        redeem(record,8).catch((reason)=>setError(reason instanceof Error?reason.message:"Payment received. Download verification is still processing.")).finally(()=>setChecking(false));
        return;
      }catch{localStorage.removeItem(`${storageKey}:pending`)}
    }
    const saved=localStorage.getItem(storageKey);
    if(!saved){setChecking(false);return}
    try{redeem(JSON.parse(saved)).catch(()=>localStorage.removeItem(storageKey)).finally(()=>setChecking(false))}
    catch{localStorage.removeItem(storageKey);setChecking(false)}
  },[storageKey,sku]);
  async function openCheckout(){
    setOpening(true);setError("");
    try{
      const claimToken=randomToken();localStorage.setItem(`${storageKey}:pending`,JSON.stringify({claimToken}));
      const response=await fetch(checkoutApi,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({productId,sku,claimToken,attribution:readAttribution()})});
      const body=await response.json();
      if(!response.ok||!body.checkoutUrl)throw new Error(body.error||"Checkout could not open.");
      trackEvent("begin_checkout",{items:[{item_id:sku}]});window.location.assign(body.checkoutUrl);
    }catch(reason){localStorage.removeItem(`${storageKey}:pending`);setError(reason instanceof Error?reason.message:"Checkout could not open. Please try again.");setOpening(false)}
  }
  if(downloads.length)return <div className="paddle-downloads purchased">{downloads.map((item)=><a className="button primary purchase-primary purchased" key={item.sku} href={item.url} onClick={()=>trackEvent("file_download",{item_id:item.sku})}><Download size={17}/>Download mockup</a>)}</div>;
  return <>{checking?<button className="button primary purchase-primary" disabled>Checking purchase…</button>:<button className="button primary purchase-primary" type="button" onClick={openCheckout} disabled={opening}>{opening?"Opening checkout…":"Buy now"}</button>}{error&&<small className="checkout-error" role="alert">{error}</small>}<Link className="mockup-existing-download" href="/order-download/">Already purchased? Restore download</Link></>;
}
