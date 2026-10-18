import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Download } from "lucide-react";

type SiteNavProps = { current?: "help" | "mockups" | "order-download" };

export function SiteNav({ current }: SiteNavProps) {
  return <nav className="nav shell">
    <Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={38} height={38} alt="" /><span>LeeMockups</span><span className="beta-badge" title="Preview release">BETA</span></Link>
    <div className="nav-links">
      <div className="nav-library">
        <details className="nav-library-menu">
          <summary>Mockup Library <ChevronDown size={14} aria-hidden="true" /></summary>
          <div className="nav-library-options">
            <Link href="/mockups/">All</Link>
            <Link href="/mockups/apparel/">Apparel</Link>
            <Link href="/mockups/mugs/">Mugs</Link>
          </div>
        </details>
      </div>
      <Link href="/#how">How it works</Link>
      <Link href="/#features">Features</Link>
      <Link href="/help/" aria-current={current === "help" ? "page" : undefined}>Help</Link>
      <Link href="/#download">Download</Link>
    </div>
    <Link className="nav-cta" href="/#download"><Download size={15} /> Get the app</Link>
  </nav>;
}
