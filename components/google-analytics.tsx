"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { consentKey, configureAnalytics, saveTrackingConsent } from "@/lib/analytics-consent";
import styles from "./google-analytics.module.css";

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  const [allowed, setAllowed] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!measurementId) return;
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

  return <>
    {allowed && <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />}
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
  </>;
}
