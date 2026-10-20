"use client";

import { trackEvent } from "@/lib/marketing-attribution";

export type DownloadKind = "free-mockup" | "paid-mockup" | "desktop-app";

export function recordDownloadClick(kind: DownloadKind, item: string) {
  try {
    const storageKey = "leemockups_download_browser_id";
    let visitorId = window.localStorage.getItem(storageKey);
    if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) {
      visitorId = window.crypto.randomUUID();
      window.localStorage.setItem(storageKey, visitorId);
    }
    const body = new URLSearchParams({ kind, item, visitorId, clickId: window.crypto.randomUUID() });
    const endpoint = "https://downloads.leemockups.com/events/download-click";
    if (!navigator.sendBeacon(endpoint, body)) {
      void fetch(endpoint, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {});
    }
    trackEvent("download_click", { item_id: item, download_kind: kind });
  } catch {
    // Analytics must never block the actual download.
  }
}
