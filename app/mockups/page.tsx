import type { Metadata } from "next";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { MockupCatalog } from "./mockup-catalog";
import { PolicyLinks } from "@/components/policy-links";
import { getSeoCatalog } from "@/lib/catalog-seo";

export const metadata: Metadata = {
  title: "Video Mockup Library",
  description: "Browse video mockup templates for product listings and social media. Add your design with LeeMockups and export an MP4 video plus still images.",
  alternates: { canonical: "/mockups/" },
};

export default async function MockupsPage() {
  const seoSkus = (await getSeoCatalog()).map((product) => product.sku);
  return <main className="mockups-page">
    <SiteNav current="mockups" />
    <section className="mockups-hero">
      <div className="shell mockups-hero-layout"><div className="mockups-hero-copy"><span className="mockups-eyebrow">LEEMOCKUPS COLLECTION</span><h1>Video Mockup Library</h1><p>Video mockup templates for product listings, social media, and client presentations. Add your design and export an MP4 video plus still images.</p></div><div className="mockups-hero-art" aria-hidden="true"><Image src="/mockup-library-hero.png" width={1200} height={1200} alt="" priority /></div></div>
    </section>
    <MockupCatalog seoSkus={seoSkus} />
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
