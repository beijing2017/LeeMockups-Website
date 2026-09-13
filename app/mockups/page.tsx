import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { assetUrl, publishedProducts } from "../../lib/products";
import { MockupCard } from "../../components/mockup-card";

export const metadata: Metadata = {
  title: "Mockup Library",
  description: "Browse animated LeeMockups templates for your product videos and still images.",
  alternates: { canonical: "/mockups/" },
};

export default function MockupsPage() {
  return <main className="library-page">
    <nav className="nav shell">
      <Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={38} height={38} alt="" /><span>LeeMockups</span></Link>
      <div className="nav-links"><Link href="/#how">How it works</Link><Link href="/#features">Features</Link><Link href="/help/">Help</Link><Link href="/#download">Download</Link><Link href="/mockups/" aria-current="page">Mockup Library</Link></div>
      <Link className="nav-cta" href="/#download"><Download size={15} /> Get the app</Link>
    </nav>
    <section className="library-content shell" aria-labelledby="library-title">
      <div className="library-heading"><span className="section-tag">LEEMOCKUPS COLLECTION</span><h1 id="library-title">Mockup Library</h1><p>Our first mockups are coming soon.</p></div>
      <div className="library-grid" aria-label="Mockup collection">
        {publishedProducts.map((product) => <MockupCard key={product.sku} product={product} thumbnail={assetUrl(product.thumbnailPath)} preview={assetUrl(product.previewPath)} />)}
        {Array.from({ length: Math.max(0, 6 - publishedProducts.length) }, (_, index) => <article className="library-placeholder" key={index} aria-label={`Upcoming mockup placeholder ${index + 1}`}>
          <div className="library-placeholder-art"><span>Coming soon</span></div>
          <div className="library-placeholder-body">
            <div className="library-skeleton library-skeleton-category" aria-hidden="true" />
            <div className="library-skeleton library-skeleton-title" aria-hidden="true" />
            <div className="library-skeleton library-skeleton-description" aria-hidden="true" />
            <div className="library-placeholder-actions"><button type="button" disabled>View Mockup</button><button type="button" disabled>Buy on Etsy</button></div>
          </div>
        </article>)}
      </div>
    </section>
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><p>Professional Mockups. Smarter Marketing.</p><span>© 2026 LeeMockups</span></footer>
  </main>;
}
