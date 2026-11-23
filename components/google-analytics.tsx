"use client";
import Script from "next/script";
import {useEffect,useState} from "react";
import {consentKey,configureAnalytics,saveTrackingConsent} from "@/lib/analytics-consent";
export function GoogleAnalytics() {
 const measurementId=process.env.NEXT_PUBLIC_GA_ID;
 const [allowed,setAllowed]=useState(false),[choosing,setChoosing]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  const update=()=>{
   const granted=measurementId ? configureAnalytics(measurementId) : false;
   setAllowed(granted);
  };
  update();try{setChoosing(!localStorage.getItem(consentKey));}catch{setChoosing(true);}
  window.addEventListener("leemockups-consent",update);window.addEventListener("storage",update);
  return()=>{window.removeEventListener("leemockups-consent",update);window.removeEventListener("storage",update);};
 },[measurementId]);
 if(!measurementId)return null;
 async function choose(value:boolean){try{await saveTrackingConsent(value);setError("");setChoosing(false);}catch{setError("Could not save privacy preferences. Please try again.");}}
 return <>
 {allowed&&<>
 <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive"/>
 </>}
 <aside aria-label="Tracking preferences" style={{position:"fixed",bottom:12,left:12,zIndex:1000,background:"white",padding:12,border:"1px solid #ddd",borderRadius:12,maxWidth:400}}>
 {choosing?<><p>Allow analytics and advertising measurement? This helps us understand visits and purchases. Buying works without tracking.</p><button onClick={()=>choose(true)}>Allow tracking</button>{" "}<button onClick={()=>choose(false)}>Reject tracking</button></>:<button onClick={()=>setChoosing(true)}>Privacy preferences</button>}
 {error&&<p role="alert">{error}</p>}
 </aside></>;
}
