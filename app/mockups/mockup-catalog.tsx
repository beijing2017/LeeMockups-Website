"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { resolveCommerce } from "@/lib/commerce";

const assetBase = "https://downloads.leemockups.com";
type Product = { sku: string; name: string; description: string; category: string; categoryName?: string; thumbnailPath: string; previewPath: string; purchaseProvider?: string; purchaseUrl?: string; deliveryUrl?: string; etsyUrl?: string; priceUsd?: number; resolution?: string; durationSeconds?: number; isFree?: boolean; keywords?: string[]; assetVersion?: string };
const categoryLabels: Record<string, string> = { MUG: "Mugs", FRM: "Frames", TSH: "T-Shirts" };

function ProductCard({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const commerce = resolveCommerce(product);
  const play = () => videoRef.current?.play().catch(() => undefined);
  const stop = () => { const video = videoRef.current; if (video) { video.pause(); video.currentTime = 0; } };
  return <Link className="mockup-card-link" href={`/mockup/${encodeURIComponent(product.sku)}/`} aria-label={`View ${product.name} details`}><article className="mockup-card">
    <div className="mockup-card-image" onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop} onContextMenu={(event) => event.preventDefault()} tabIndex={0}>
      {product.isFree && <span className="mockup-free-badge">FREE</span>}
      <img src={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} alt={product.name} loading="lazy" draggable={false} />
      <video ref={videoRef} muted loop playsInline preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture draggable={false} onContextMenu={(event) => event.preventDefault()} poster={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} aria-label={`${product.name} animated preview`}><source src={`${assetBase}/${product.previewPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} type="video/webm" /></video>
      <span className="mockup-video-guard" aria-hidden="true" />
    </div>
    <div className="mockup-card-body"><div className="mockup-specs"><div className="mockup-price"><strong>{product.isFree ? "Free" : commerce.price}</strong>{!product.isFree && commerce.launchSpecial && <span className="launch-badge">Launch Special</span>}</div><div><span>{commerce.resolution}</span><span>{commerce.duration}</span></div></div></div>
  </article></Link>;
}

function CatalogSkeleton() {
  return <div className="catalog-loading" role="status" aria-live="polite" aria-label="Loading mockups">
    <div className="catalog-loading-label"><span className="catalog-loading-spinner" aria-hidden="true" />Loading mockups…</div>
    <div className="mockup-grid" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <article className="mockup-card mockup-card-skeleton" key={index}>
      <div className="mockup-card-image" />
      <div className="mockup-card-body"><span className="skeleton-line skeleton-price" /></div>
    </article>)}</div>
  </div>;
}

export function MockupCatalog() {
  const [products, setProducts] = useState<Product[]>([]), [selectedCategory, setSelectedCategory] = useState("ALL"), [loading, setLoading] = useState(true), [failed, setFailed] = useState(false);
  useEffect(() => { fetch(`${assetBase}/catalog/products.json`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setProducts(Array.isArray(data?.products) ? data.products.map((product: Product) => ({ ...product, assetVersion: data.updatedAt })) : [])).catch(() => setFailed(true)).finally(() => setLoading(false)); }, []);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products]);
  const categoryNames = Object.fromEntries(products.map((product) => [product.category, product.categoryName || categoryLabels[product.category] || product.category]));
  const visible = selectedCategory === "ALL" ? products : products.filter((product) => product.category === selectedCategory);
  return <section className="catalog shell" aria-label="Mockup catalog">{loading ? <CatalogSkeleton /> : <>{categories.length > 0 && <div className="catalog-categories" aria-label="Filter mockups by category"><button type="button" className={selectedCategory === "ALL" ? "selected" : ""} onClick={() => setSelectedCategory("ALL")}>All</button>{categories.map((category) => <button type="button" className={selectedCategory === category ? "selected" : ""} onClick={() => setSelectedCategory(category)} key={category}>{categoryNames[category]}</button>)}</div>}{failed ? <div className="catalog-no-results"><h2>Unable to load the library</h2><p>Please refresh the page in a moment.</p></div> : !products.length ? <div className="catalog-no-results"><h2>New mockups are on the way</h2></div> : <div className="mockup-grid">{visible.map((product) => <ProductCard product={product} key={product.sku} />)}</div>}</>}</section>;
}
