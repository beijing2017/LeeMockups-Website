import { trackingAllowed } from "./analytics-consent";
export type MarketingAttribution = {
  source:string; medium:string; campaign:string; content:string; referrer:string;
};

const storageKey = "leemockups-attribution";
const clean = (value:string|null, limit=80) => String(value || "").trim().slice(0, limit);

export function captureAttribution():MarketingAttribution|null {
  if (!trackingAllowed()) return null;
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
  if (!trackingAllowed()) return null;
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "null");
    return value && typeof value.source === "string" ? value : null;
  } catch { return null; }
}

export function trackEvent(name:string, parameters:Record<string,unknown> = {}) {
  if (!trackingAllowed()) return;
  const gtag = (window as typeof window & {gtag?:(command:string,name:string,parameters:Record<string,unknown>)=>void}).gtag;
  if (typeof gtag === "function") {try {gtag("event", name, parameters);} catch { /* Tracking cannot block checkout navigation. */ }}
}

export async function readAnalyticsIdentifiers():Promise<{clientId?:string;sessionId?:string;consent:string;reason:string}> {
  const unavailable = (reason:string) => ({consent:trackingAllowed()?"granted":"denied",reason});
  if (!trackingAllowed()) return unavailable("consent_denied");
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  // The local gtag queue exists immediately after consent. Wait for the Google
  // script itself before asking it for an identifier.
  const browser = window as typeof window & {gtag?:(...args:unknown[])=>void;leemockupsGaTagState?:"ready"|"failed"};
  if (!measurementId) return unavailable("tag_unavailable");
  if (browser.leemockupsGaTagState !== "ready" && browser.leemockupsGaTagState !== "failed") {
    await new Promise<void>(resolve => {
      const finish = () => { window.clearTimeout(timer); window.removeEventListener("leemockups-ga-tag-state",finish); resolve(); };
      const timer = window.setTimeout(finish, 5000);
      window.addEventListener("leemockups-ga-tag-state",finish);
      if (browser.leemockupsGaTagState) finish();
    });
  }
  if (!trackingAllowed()) return unavailable("consent_denied");
  if (browser.leemockupsGaTagState !== "ready") return unavailable(browser.leemockupsGaTagState === "failed" ? "tag_load_failed" : "tag_not_ready");
  const gtag = (window as typeof window & {gtag?:(...args:unknown[])=>void}).gtag;
  if (!measurementId || typeof gtag !== "function") return unavailable("tag_unavailable");
  const get = (field:"client_id"|"session_id") => new Promise<string>((resolve) => {
    let settled = false;
    const finish = (value:unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(typeof value === "string" || typeof value === "number" ? String(value) : "");
    };
    const timer=window.setTimeout(() => finish(""), 3000);
    try { gtag("get", measurementId, field, finish); } catch { finish(""); }
  });
  let [clientId, sessionId] = await Promise.all([get("client_id"), get("session_id")]);
  if (!/^\d+\.\d+$/.test(clientId) && trackingAllowed()) clientId = await get("client_id");
  if (!trackingAllowed()) return unavailable("consent_denied");
  return {
    consent:"granted", reason:/^\d+\.\d+$/.test(clientId)?"available":"client_id_missing",
    ...(/^\d+\.\d+$/.test(clientId) && {clientId}),
    ...(/^\d+$/.test(sessionId) && {sessionId}),
  };
}

