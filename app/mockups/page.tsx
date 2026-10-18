import type { Metadata } from "next";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { MockupCatalog } from "./mockup-catalog";
import { PolicyLinks } from "@/components/policy-links";
import { getSeoCatalogData } from "@/lib/catalog-seo";

export const metadata: Metadata = {
  title: "Video Mockups for POD Sellers",
  description: "Browse T-shirt and mug video mockups for print-on-demand (POD) sellers. Create product videos and still images for Etsy listings, Shopify stores, and your own shop.",
  alternates: { canonical: "/mockups/" },
};

export default async function MockupsPage() {
  const { products, homeFeaturedSkus } = await getSeoCatalogData();
  const seoSkus = products.map((product) => product.sku);
  return <main className="mockups-page">
    <SiteNav current="mockups" />
    <section className="mockups-hero">
      <div className="shell mockups-hero-layout"><div className="mockups-hero-copy"><span className="mockups-eyebrow">LEEMOCKUPS COLLECTION</span><h1>Video Mockups for POD Sellers</h1><p>Explore T-shirt and mug video mockups for print-on-demand product listings. Create product videos and still images for your Etsy shop, Shopify store, or your own website—without filming every item.</p></div><div className="mockups-hero-art" aria-hidden="true"><Image src="/mockup-library-hero.png" width={1200} height={1200} alt="" priority /></div></div>
    </section>
    <MockupCatalog seoSkus={seoSkus} initialProducts={products} initialHomeFeaturedSkus={homeFeaturedSkus} />
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
