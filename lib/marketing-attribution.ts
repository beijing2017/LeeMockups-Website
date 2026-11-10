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

export async function readAnalyticsIdentifiers():Promise<{clientId?:string;sessionId?:string}> {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  const gtag = (window as typeof window & {gtag?:(...args:unknown[])=>void}).gtag;
  if (!measurementId || typeof gtag !== "function") return {};
  const get = (field:"client_id"|"session_id") => new Promise<string>((resolve) => {
    let settled = false;
    const finish = (value:unknown) => {
      if (settled) return;
      settled = true;
      resolve(typeof value === "string" || typeof value === "number" ? String(value) : "");
    };
    window.setTimeout(() => finish(""), 1500);
    try { gtag("get", measurementId, field, finish); } catch { finish(""); }
  });
  const [clientId, sessionId] = await Promise.all([get("client_id"), get("session_id")]);
  return {
    ...(clientId && {clientId}),
    ...(sessionId && {sessionId}),
  };
}

