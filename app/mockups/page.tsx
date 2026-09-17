import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Mockup Library",
  description: "Browse animated LeeMockups templates for your product videos and still images.",
  alternates: { canonical: "/mockups/" },
};

export default function MockupsPage() {
  return <main className="library-page">
    <SiteNav current="mockups" />
    <section className="library-content shell" aria-labelledby="library-title">
      <div className="library-heading"><span className="section-tag">LEEMOCKUPS COLLECTION</span><h1 id="library-title">Mockup Library</h1><p>Our first mockups are coming soon.</p></div>
      <div className="library-grid" aria-label="Upcoming mockup collection">
        {Array.from({ length: 6 }, (_, index) => <article className="library-placeholder" key={index} aria-label={`Upcoming mockup placeholder ${index + 1}`}>
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
