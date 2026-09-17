import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";

type SiteNavProps = { current?: "help" | "mockups" | "order-download" };

export function SiteNav({ current }: SiteNavProps) {
  return <nav className="nav shell">
    <Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={38} height={38} alt="" /><span>LeeMockups</span><span className="beta-badge" title="Preview release">BETA</span></Link>
    <div className="nav-links">
      <Link href="/#how">How it works</Link>
      <Link href="/#features">Features</Link>
      <Link href="/help/" aria-current={current === "help" ? "page" : undefined}>Help</Link>
      <Link href="/#download">Download</Link>
      <Link href="/mockups/" aria-current={current === "mockups" ? "page" : undefined}>Mockup Library</Link>
      <Link href="/order-download/" aria-current={current === "order-download" ? "page" : undefined}>Order download</Link>
    </div>
    <Link className="nav-cta" href="/#download"><Download size={15} /> Get the app</Link>
  </nav>;
}
