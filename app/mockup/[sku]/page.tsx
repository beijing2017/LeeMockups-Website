import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { MockupDetailClient } from "../mockup-detail-client";
import { ProductCard } from "@/app/mockups/mockup-catalog";
import { catalogAssetBase, getSeoCatalog, productUrl } from "@/lib/catalog-seo";
import { matchesMockupCategory } from "@/lib/mockup-categories";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getSeoCatalog()).map((product) => ({ sku: product.sku }));
}

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { sku } = await params;
  const product = (await getSeoCatalog()).find((item) => item.sku === sku);
  if (!product) return { title: "Mockup not found", robots: { index: false } };
  const title = `${product.name} | LeeMockups`;
  const description = product.description || `Create a ${product.name.toLowerCase()} with your design in LeeMockups.`;
  const url = productUrl(sku);
  const image = `${catalogAssetBase}/${product.thumbnailPath}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url, images: [{ url: image, alt: product.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const catalog = await getSeoCatalog();
  const product = catalog.find((item) => item.sku === sku);
  if (!product) notFound();
  const sameCategory = catalog.filter((item) => item.category === product.category);
  const productIndex = sameCategory.findIndex((item) => item.sku === sku);
  const relatedProducts = Array.from({ length: Math.min(3, sameCategory.length - 1) }, (_, offset) =>
    sameCategory[(productIndex + offset + 1) % sameCategory.length]
  );
  const categoryLabel = product.category === "SHI" ? "T-shirt" : product.category === "MUG" ? "mug" : "product";
  const categoryLink = matchesMockupCategory(product, "apparel")
    ? { href: "/mockups/apparel/", label: "View all apparel mockups" }
    : matchesMockupCategory(product, "mugs")
      ? { href: "/mockups/mugs/", label: "View all mug mockups" }
      : { href: "/mockups/", label: "View the full library" };
  const url = productUrl(sku);
  const description = product.description || `Create a ${product.name.toLowerCase()} with your design in LeeMockups.`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    sku,
    name: product.name,
    description,
    image: [`${catalogAssetBase}/${product.thumbnailPath}`],
    category: product.category,
    brand: { "@type": "Brand", name: "LeeMockups" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: product.isFree ? 0 : Number(product.priceUsd ?? 9.9),
      availability: "https://schema.org/InStock",
    },
  };
  return <main className="mockup-product-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <SiteNav current="mockups" />
    <MockupDetailClient sku={sku} initialProduct={product} />
    {relatedProducts.length > 0 && <section className="related-mockups shell" aria-labelledby="related-mockups-title">
      <div className="related-mockups-heading"><div><span className="mockup-section-kicker">EXPLORE MORE</span><h2 id="related-mockups-title">More {categoryLabel} video mockups</h2><p>Compare scenes for your print-on-demand listings on Etsy, Shopify, or your own store.</p></div><Link href={categoryLink.href}>{categoryLink.label} →</Link></div>
      <div className="mockup-grid">{relatedProducts.map((item) => <ProductCard product={item} seoReady key={item.sku} />)}</div>
    </section>}
    <footer className="legal-footer shell"><strong>LeeMockups</strong><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
