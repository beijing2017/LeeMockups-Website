export type MarketingAttribution = {
  source:string; medium:string; campaign:string; content:string; referrer:string;
};

const storageKey = "leemockups-attribution";
const clean = (value:string|null, limit=80) => String(value || "").trim().slice(0, limit);

export function captureAttribution():MarketingAttribution {
  const params = new URLSearchParams(window.location.search);
  const existing = readAttribution();
  const hasCampaign = ["utm_source","utm_medium","utm_campaign","utm_content"].some((key) => params.has(key));
  if (!hasCampaign && existing) return existing;
  let referrer = "";
  try { referrer = document.referrer ? new URL(document.referrer).hostname : ""; } catch {}
  const attribution:MarketingAttribution = {
    source:clean(params.get("utm_source")) || clean(referrer) || "direct",
    medium:clean(params.get("utm_medium")) || (referrer ? "referral" : "none"),
    campaign:clean(params.get("utm_campaign")),
    content:clean(params.get("utm_content")),
    referrer:clean(referrer),
  };
  localStorage.setItem(storageKey, JSON.stringify(attribution));
  return attribution;
}

export function readAttribution():MarketingAttribution|null {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "null");
    return value && typeof value.source === "string" ? value : null;
  } catch { return null; }
}

export function trackEvent(name:string, parameters:Record<string,unknown> = {}) {
  const gtag = (window as typeof window & {gtag?:(command:string,name:string,parameters:Record<string,unknown>)=>void}).gtag;
  if (typeof gtag === "function") gtag("event", name, parameters);
}
