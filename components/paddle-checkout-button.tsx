"use client";

import { useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddlePromise:Promise<Paddle|undefined>|undefined;

export function PaddleCheckoutButton({priceId}:{priceId:string}){
  const [opening,setOpening]=useState(false);
  const [error,setError]=useState("");
  async function openCheckout(){
    const token=process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if(!token){setError("Checkout is temporarily unavailable.");return}
    setOpening(true);setError("");
    try{
      paddlePromise ||= initializePaddle({token});
      const paddle=await paddlePromise;
      if(!paddle) throw new Error("Paddle did not initialize.");
      paddle.Checkout.open({items:[{priceId,quantity:1}],settings:{displayMode:"overlay",theme:"light",locale:"en"}});
    }catch{setError("Checkout could not open. Please try again.")}
    finally{setOpening(false)}
  }
  return <><button className="button primary" type="button" onClick={openCheckout} disabled={opening}>{opening?"Opening checkout…":"Buy now"}</button>{error&&<small className="checkout-error" role="alert">{error}</small>}</>
}
