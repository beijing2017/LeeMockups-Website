"use client";

import Link from "next/link";

export function PolicyLinks() {
  return <nav className="policy-links" aria-label="Legal and support">
    <Link href="/about/">About LeeMockups</Link>
    <Link href="/terms/">Terms of Service</Link>
    <Link href="/privacy/">Privacy Policy</Link>
    <button type="button" className="privacy-settings-link" onClick={() => window.dispatchEvent(new Event("leemockups-open-privacy"))}>Privacy settings</button>
    <Link href="/refunds/">Refund Policy</Link>
    <a href="mailto:support@leemockups.com">support@leemockups.com</a>
  </nav>;
}
