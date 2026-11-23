"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { consentKey, configureAnalytics, saveTrackingConsent } from "@/lib/analytics-consent";
import { readAnalyticsIdentifiers } from "@/lib/marketing-attribution";
import styles from "./google-analytics.module.css";

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  const [allowed, setAllowed] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState("");
  const [showCheck, setShowCheck] = useState(false);
  const [checkResult, setCheckResult] = useState("");

  useEffect(() => {
    if (!measurementId) return;
    setShowCheck(new URLSearchParams(window.location.search).has("analytics_check"));
    const update = () => setAllowed(configureAnalytics(measurementId));
    update();

    let hasChoice = false;
    try { hasChoice = localStorage.getItem(consentKey) !== null; } catch { /* Keep tracking off. */ }
    const reveal = () => {
      if (window.scrollY < 120) return;
      setChoosing(true);
      window.removeEventListener("scroll", reveal);
    };
    if (!hasChoice) window.addEventListener("scroll", reveal, { passive: true });
    const openPreferences = () => {
      window.removeEventListener("scroll", reveal);
      setChoosing(true);
    };
    window.addEventListener("leemockups-open-privacy", openPreferences);
    window.addEventListener("leemockups-consent", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("scroll", reveal);
      window.removeEventListener("leemockups-open-privacy", openPreferences);
      window.removeEventListener("leemockups-consent", update);
      window.removeEventListener("storage", update);
    };
  }, [measurementId]);

  if (!measurementId) return null;

  function choose(value: boolean) {
    try {
      saveTrackingConsent(value);
      setError("");
      setChoosing(false);
    } catch {
      setError("Your choice could not be saved. Please try again.");
    }
  }

  async function checkAnalytics() {
    setCheckResult("Checking…");
    const result = await readAnalyticsIdentifiers();
    setCheckResult(result.clientId ? "GA4 Client ID is available. No purchase was sent." : `GA4 Client ID unavailable (${result.reason}). No purchase was sent.`);
  }

  return <>
    {allowed && <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive"
      onReady={() => { (window as typeof window & {leemockupsGaTagState?:string}).leemockupsGaTagState = "ready"; window.dispatchEvent(new Event("leemockups-ga-tag-state")); }}
      onError={() => { (window as typeof window & {leemockupsGaTagState?:string}).leemockupsGaTagState = "failed"; window.dispatchEvent(new Event("leemockups-ga-tag-state")); }} />}
    {choosing && <aside className={styles.notice} aria-label="Optional analytics preferences">
      <div className={styles.copy}>
        <strong>Optional analytics</strong>
        <p>May we measure visits and purchases to improve LeeMockups? You can use the site and buy mockups without tracking. <Link href="/privacy/">Privacy Policy</Link></p>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.reject} onClick={() => choose(false)}>Reject</button>
        <button type="button" className={styles.allow} onClick={() => choose(true)}>Allow</button>
      </div>
    </aside>}
    {showCheck && <aside className={styles.check} aria-label="Analytics connection check">
      <strong>Analytics connection check</strong>
      <p>This checks whether this browser can provide a GA4 Client ID. It does not create an order or send a purchase event.</p>
      <button type="button" onClick={checkAnalytics}>Check connection</button>
      {checkResult && <p role="status">{checkResult}</p>}
    </aside>}
  </>;
}
