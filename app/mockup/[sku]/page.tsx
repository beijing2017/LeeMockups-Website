import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { MockupDetailClient } from "../mockup-detail-client";
import { ProductCard } from "@/app/mockups/mockup-catalog";
import { catalogAssetBase, getSeoCatalog, productUrl } from "@/lib/catalog-seo";
import { getMockupCategories, matchesMockupCategory } from "@/lib/mockup-categories";
import { resolveCommerce, resolvePriceUsd } from "@/lib/commerce";

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
  const category = getMockupCategories(catalog).find(({ slug }) => matchesMockupCategory(product, slug));
  const sameCategory = catalog.filter((item) => category ? matchesMockupCategory(item, category.slug) : item.category === product.category);
  const productIndex = sameCategory.findIndex((item) => item.sku === sku);
  const relatedProducts = Array.from({ length: Math.min(3, sameCategory.length - 1) }, (_, offset) =>
    sameCategory[(productIndex + offset + 1) % sameCategory.length]
  );
  const categoryLabel = category?.label || "Product";
  const categoryLink = category
    ? { href: `/mockups/${category.slug}/`, label: `View all ${category.label.toLowerCase()} mockups` }
    : { href: "/mockups/", label: "View the full library" };
  const url = productUrl(sku);
  const description = product.description || `Create a ${product.name.toLowerCase()} with your design in LeeMockups.`;
  const commerce = resolveCommerce(product);
  const hasCheckout = commerce.available ||
    (Boolean(product.providerProductId) && ["CREEM", "PADDLE"].includes(commerce.provider));
  const price = product.isFree ? 0 : resolvePriceUsd(product);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    sku,
    name: product.name,
    description,
    url,
    image: [`${catalogAssetBase}/${product.thumbnailPath}`],
    category: category?.label,
    brand: { "@type": "Brand", name: "LeeMockups" },
    offers: (product.isFree || hasCheckout) && Number.isFinite(price) && price >= 0 ? {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price,
      availability: "https://schema.org/InStock",
    } : undefined,
  };
  return <main className="mockup-product-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <SiteNav current="mockups" />
    <MockupDetailClient sku={sku} initialProduct={product} />
    <section className="related-mockups shell" aria-labelledby="related-mockups-title">
      <div className="related-mockups-heading"><div><span className="mockup-section-kicker">EXPLORE MORE</span><h2 id="related-mockups-title">More {categoryLabel} video mockups</h2><p>Compare scenes for your print-on-demand listings on Etsy, Shopify, or your own store.</p></div><Link href={categoryLink.href}>{categoryLink.label} →</Link></div>
      {relatedProducts.length > 0 && <div className="mockup-grid">{relatedProducts.map((item) => <ProductCard product={item} seoReady key={item.sku} />)}</div>}
    </section>
    <footer className="legal-footer shell"><strong>LeeMockups</strong><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
