"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { resolveCommerce } from "@/lib/commerce";
import type { CatalogProduct } from "@/lib/catalog-seo";
import { getMockupCategories, matchesMockupCategory } from "@/lib/mockup-categories";
import { MockupPrice } from "@/components/mockup-price";

const assetBase = "https://downloads.leemockups.com";
type Product = CatalogProduct;

export function ProductCard({ product, seoReady }: { product: Product; seoReady: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const commerce = resolveCommerce(product);
  const play = () => videoRef.current?.play().catch(() => undefined);
  const stop = () => { const video = videoRef.current; if (video) { video.pause(); video.currentTime = 0; } };
  return <Link className="mockup-card-link" href={seoReady?`/mockup/${encodeURIComponent(product.sku)}/`:`/mockup/?sku=${encodeURIComponent(product.sku)}`} aria-label={`View ${product.name} details`}><article className="mockup-card">
    <div className="mockup-card-image" onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop} onContextMenu={(event) => event.preventDefault()} tabIndex={0}>
      <img src={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} alt={product.name} loading="lazy" draggable={false} />
      <video ref={videoRef} muted loop playsInline preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture draggable={false} onContextMenu={(event) => event.preventDefault()} poster={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} aria-label={`${product.name} animated preview`}><source src={`${assetBase}/${product.previewPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} type="video/webm" /></video>
      <span className="mockup-video-guard" aria-hidden="true" />
    </div>
    <div className="mockup-card-body"><div className="mockup-specs"><MockupPrice product={product}/><div><span>{commerce.resolution}</span><span>{commerce.duration}</span></div></div></div>
  </article></Link>;
}

function CatalogSkeleton({ count = 4 }: { count?: number }) {
  return <div className="catalog-loading" role="status" aria-live="polite" aria-label="Loading mockups">
    <div className="catalog-loading-label"><span className="catalog-loading-spinner" aria-hidden="true" />Loading mockups…</div>
    <div className="mockup-grid" aria-hidden="true">{Array.from({ length: count }, (_, index) => <article className="mockup-card mockup-card-skeleton" key={index}>
      <div className="mockup-card-image" />
      <div className="mockup-card-body"><span className="skeleton-line skeleton-price" /></div>
    </article>)}</div>
  </div>;
}

const categoryPriority: Record<string, number> = { SHI: 0, TSH: 0, HOO: 0, MUG: 1 };

function interleaveCategories(products: Product[], categories: string[]): Product[] {
  if (!categories.length) return products;
  const buckets = categories.map((category) => products.filter((product) => product.category === category));
  const uncategorized = products.filter((product) => !categories.includes(product.category));
  if (uncategorized.length) buckets.push(uncategorized);
  const result: Product[] = [];
  for (let index = 0; result.length < products.length; index++) {
    for (const bucket of buckets) if (bucket[index]) result.push(bucket[index]);
  }
  return result;
}

export function MockupCatalog({ seoSkus, initialProducts, initialHomeFeaturedSkus, previewLimit, categoryGroup }: { seoSkus: string[]; initialProducts: Product[]; initialHomeFeaturedSkus: string[]; previewLimit?: number; categoryGroup?: string }) {
  const [products, setProducts] = useState<Product[]>(initialProducts), [homeFeaturedSkus, setHomeFeaturedSkus] = useState<string[]>(initialHomeFeaturedSkus), [loading, setLoading] = useState(initialProducts.length === 0), [failed, setFailed] = useState(false);
  useEffect(() => { fetch(`${assetBase}/catalog/products.json`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => { setProducts(Array.isArray(data?.products) ? data.products.map((product: Product) => ({ ...product, assetVersion: data.updatedAt })) : []); setHomeFeaturedSkus(Array.isArray(data?.homeFeaturedSkus) ? [...new Set<string>(data.homeFeaturedSkus.filter((sku: unknown): sku is string => typeof sku === "string"))].slice(0, 8) : []); }).catch(() => { if (!initialProducts.length) setFailed(true); }).finally(() => setLoading(false)); }, [initialProducts.length]);
  const categoryProducts = categoryGroup ? products.filter((product) => matchesMockupCategory(product, categoryGroup)) : products;
  const categoryCodes = useMemo(() => [...new Set(categoryProducts.map((product) => product.category).filter(Boolean))].sort((a, b) => (categoryPriority[a] ?? 99) - (categoryPriority[b] ?? 99) || a.localeCompare(b)), [categoryProducts]);
  const categories = useMemo(() => getMockupCategories(products), [products]);
  const visible = [...categoryProducts].sort((a, b) => categoryGroup
    ? Number(b.isFree) - Number(a.isFree) || (categoryPriority[a.category] ?? 99) - (categoryPriority[b.category] ?? 99)
    : (categoryPriority[a.category] ?? 99) - (categoryPriority[b.category] ?? 99) || Number(b.isFree) - Number(a.isFree));
  const homepageOrder = previewLimit ? interleaveCategories(visible, categoryCodes) : visible;
  const featured = homeFeaturedSkus.flatMap((sku) => homepageOrder.find((product) => product.sku === sku) || []);
  const displayed = previewLimit ? [...featured, ...homepageOrder.filter((product) => !homeFeaturedSkus.includes(product.sku))].slice(0, previewLimit) : visible;
  return <section className="catalog shell" aria-label="Mockup catalog">{loading ? <CatalogSkeleton count={previewLimit} /> : <>{!previewLimit && <div className="catalog-categories" aria-label="Browse mockups by category"><Link href="/mockups/" className={!categoryGroup ? "selected" : ""}>All</Link>{categories.map(({ slug, label }) => <Link href={`/mockups/${slug}/`} className={categoryGroup === slug ? "selected" : ""} key={slug}>{label}</Link>)}</div>}{failed ? <div className="catalog-no-results"><h2>Unable to load the library</h2><p>Please refresh the page in a moment.</p></div> : !categoryProducts.length ? <div className="catalog-no-results"><h2>New mockups are on the way</h2></div> : <div className="mockup-grid">{displayed.map((product) => <ProductCard product={product} seoReady={seoSkus.includes(product.sku)} key={product.sku} />)}</div>}</>}</section>;
}
