export const consentKey = "leemockups-tracking-consent";
export function trackingAllowed() {
 try {
  if ((navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl) return false;
  const value=JSON.parse(localStorage.getItem(consentKey)||"null");
  return value?.analytics === true && value?.advertising === true;
 } catch { return false; }
}
export function saveTrackingConsent(allowed:boolean) {
 localStorage.setItem(consentKey,JSON.stringify({analytics:allowed,advertising:allowed}));
 if(!allowed)localStorage.removeItem("leemockups-attribution");
 window.dispatchEvent(new Event("leemockups-consent"));
}

export function configureAnalytics(measurementId:string) {
 const browser=window as typeof window & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;leemockupsGaConfigured?:boolean};
 const allowed=trackingAllowed();
 (window as unknown as Record<string,unknown>)[`ga-disable-${measurementId}`]=!allowed;
 if(!allowed){browser.gtag?.("consent","update",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});return false;}
 browser.dataLayer=browser.dataLayer||[];
 // Google's standard queue format is an Arguments object, not a plain Array.
 browser.gtag=browser.gtag||function(){browser.dataLayer!.push(arguments);};
 if(!browser.leemockupsGaConfigured){
  browser.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
 }
 browser.gtag("consent","update",{analytics_storage:"granted",ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted"});
 if(!browser.leemockupsGaConfigured){browser.gtag("js",new Date());browser.gtag("config",measurementId,{anonymize_ip:true});browser.leemockupsGaConfigured=true;}
 return true;
}
