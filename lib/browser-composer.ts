"use client";

export type VerifiedMockup = { sku: string; name: string; url: string };

export function openPurchasedComposer(item: VerifiedMockup) {
  if (!/^LM-VM-[A-Z]{3}-\d{3}$/.test(item.sku)) throw new Error("Invalid mockup reference.");
  const url = new URL(item.url);
  if (url.origin !== "https://downloads.leemockups.com" || url.pathname !== `/d/${item.sku}`) {
    throw new Error("The purchase link could not be verified. Please try again.");
  }
  sessionStorage.setItem(`leemockups-render:${item.sku}`, url.href);
  window.location.assign(`/composer/?sku=${encodeURIComponent(item.sku)}`);
}
