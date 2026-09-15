import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import MockupCatalog from "./mockup-catalog";
import { products } from "@/lib/products";
import "./catalog.css";

export const metadata: Metadata = {
  title: "Mockup Library",
  description: "Browse animated LeeMockups templates for your product videos and still images.",
  alternates: { canonical: "/mockups/" },
};

export default function MockupsPage() {
  return <main className="library-page">
    <nav className="nav shell">
      <Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={38} height={38} alt="" /><span>LeeMockups</span><span className="beta-badge" title="Preview release">BETA</span></Link>
      <div className="nav-links"><Link href="/#how">How it works</Link><Link href="/#features">Features</Link><Link href="/help/">Help</Link><Link href="/#download">Download</Link><Link href="/mockups/" aria-current="page">Mockup Library</Link></div>
      <Link className="nav-cta" href="/#download"><Download size={15} /> Get the app</Link>
    </nav>
    <section className="library-content shell" aria-labelledby="library-title">
      <div className="library-heading"><span className="section-tag">LEEMOCKUPS COLLECTION</span><h1 id="library-title">Mockup Library</h1><p>Explore animated mockups for your product listings. Our first release is coming soon.</p></div>
      <MockupCatalog products={products} />
    </section>
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><p>Professional Mockups. Smarter Marketing.</p><span>© 2026 LeeMockups</span></footer>
  </main>;
}
