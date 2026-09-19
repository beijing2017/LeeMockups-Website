import type { Metadata } from "next";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { MockupCatalog } from "./mockup-catalog";
import { PolicyLinks } from "@/components/policy-links";

export const metadata: Metadata = {
  title: "Mockup Library",
  description: "Browse animated LeeMockups templates for product videos and still images.",
  alternates: { canonical: "/mockups/" },
};

export default function MockupsPage() {
  return <main className="mockups-page">
    <SiteNav current="mockups" />
    <section className="mockups-hero">
      <div className="shell mockups-hero-layout"><div className="mockups-hero-copy"><span className="mockups-eyebrow">LEEMOCKUPS COLLECTION</span><h1>Mockup Library</h1><p>Animated mockups made for product listings, social media, and client presentations.</p></div><div className="mockups-hero-art" aria-hidden="true"><Image src="/mockup-library-hero.png" width={1200} height={1200} alt="" priority /></div></div>
    </section>
    <MockupCatalog />
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
