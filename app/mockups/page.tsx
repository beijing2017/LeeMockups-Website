import type { Metadata } from "next";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { MockupCatalog } from "./mockup-catalog";
import { PolicyLinks } from "@/components/policy-links";
import { getSeoCatalogData } from "@/lib/catalog-seo";

export const metadata: Metadata = {
  title: "T-Shirt & Mug Video Mockup Library for POD Sellers",
  description: "Browse T-shirt and mug video mockups for print-on-demand sellers. Create product videos and still images for marketplaces, independent stores, and social promotion.",
  alternates: { canonical: "/mockups/" },
};

export default async function MockupsPage() {
  const { products, homeFeaturedSkus } = await getSeoCatalogData();
  const seoSkus = products.map((product) => product.sku);
  return <main className="mockups-page mockups-all-page">
    <SiteNav current="mockups" />
    <section className="mockups-hero">
      <div className="shell mockups-hero-layout"><div className="mockups-hero-copy"><span className="mockups-eyebrow">LEEMOCKUPS COLLECTION</span><h1>Video Mockups<br />{" for POD Sellers"}</h1><p>Explore T-shirt and mug video mockups for print-on-demand products. Create videos and still images for marketplace listings, your own storefront, and social promotion—without filming every item.</p></div><div className="mockups-hero-art" aria-hidden="true"><Image src="/mockup-library-hero.png" width={1200} height={1200} alt="" priority /></div></div>
    </section>
    <MockupCatalog seoSkus={seoSkus} initialProducts={products} initialHomeFeaturedSkus={homeFeaturedSkus} />
    <section className="sales-channels shell" aria-labelledby="sales-channels-title">
      <div className="sales-channels-heading"><span className="mockups-eyebrow">BUILT FOR POD SELLERS</span><h2 id="sales-channels-title">For the places you sell</h2><p>Use your exported videos and still images to present products wherever you reach customers.</p></div>
      <div className="sales-channels-grid">
        <div><h3>Marketplaces</h3><p>Etsy and eBay product listings.</p></div>
        <div><h3>Your own store</h3><p>Shopify, WooCommerce, BigCommerce, Wix, and Squarespace storefronts.</p></div>
        <div><h3>Social promotion</h3><p>TikTok Shop, Instagram, and Pinterest content that points shoppers to your products.</p></div>
      </div>
      <p className="sales-channels-note">LeeMockups exports media files; it does not connect directly to these platforms. Check each channel’s current upload and content rules before publishing.</p>
    </section>
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
