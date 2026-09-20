import Link from "next/link";

export function PolicyLinks() {
  return <nav className="policy-links" aria-label="Legal and support">
    <Link href="/terms/">Terms of Service</Link>
    <Link href="/privacy/">Privacy Policy</Link>
    <Link href="/refunds/">Refund Policy</Link>
    <a href="mailto:support@leemockups.com">support@leemockups.com</a>
  </nav>;
}
