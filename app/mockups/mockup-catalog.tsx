"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const assetBase = "https://downloads.leemockups.com";
type Product = { sku: string; name: string; description: string; category: string; thumbnailPath: string; previewPath: string; etsyUrl: string; keywords?: string[]; assetVersion?: string };
const categoryLabels: Record<string, string> = { MUG: "Mugs", FRM: "Frames", TSH: "T-Shirts" };

function ProductCard({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isAvailable = Boolean(product.etsyUrl?.trim());
  const play = () => videoRef.current?.play().catch(() => undefined);
  const stop = () => { const video = videoRef.current; if (video) { video.pause(); video.currentTime = 0; } };
  return <article className="mockup-card">
    <div className="mockup-card-image" onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop} onContextMenu={(event) => event.preventDefault()} tabIndex={0}>
      <img src={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} alt={product.name} loading="lazy" draggable={false} />
      <video ref={videoRef} muted loop playsInline preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture draggable={false} onContextMenu={(event) => event.preventDefault()} poster={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} aria-label={`${product.name} animated preview`}><source src={`${assetBase}/${product.previewPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} type="video/webm" /></video>
      <span className="mockup-video-guard" aria-hidden="true" />
    </div>
    <div className="mockup-card-body"><div className="mockup-specs"><strong>$9.9</strong><div><span>2000 × 2000</span><span>10 sec</span></div></div><div className="mockup-card-actions">{isAvailable ? <><a className="mockup-buy-button" href={product.etsyUrl} target="_blank" rel="noreferrer">Buy on Etsy</a><a href="/order-download/">Already purchased? Download →</a></> : <button className="mockup-buy-button unavailable" type="button" disabled>Coming Soon</button>}</div></div>
  </article>;
}

export function MockupCatalog() {
  const [products, setProducts] = useState<Product[]>([]), [selectedCategory, setSelectedCategory] = useState("ALL"), [loading, setLoading] = useState(true), [failed, setFailed] = useState(false);
  useEffect(() => { fetch(`${assetBase}/catalog/products.json`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setProducts(Array.isArray(data?.products) ? data.products.map((product: Product) => ({ ...product, assetVersion: data.updatedAt })) : [])).catch(() => setFailed(true)).finally(() => setLoading(false)); }, []);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products]);
  const visible = selectedCategory === "ALL" ? products : products.filter((product) => product.category === selectedCategory);
  return <section className="catalog shell" aria-label="Mockup catalog">{categories.length > 0 && <div className="catalog-categories" aria-label="Filter mockups by category"><button type="button" className={selectedCategory === "ALL" ? "selected" : ""} onClick={() => setSelectedCategory("ALL")}>All</button>{categories.map((category) => <button type="button" className={selectedCategory === category ? "selected" : ""} onClick={() => setSelectedCategory(category)} key={category}>{categoryLabels[category] || category}</button>)}</div>}{failed ? <div className="catalog-no-results"><h2>Unable to load the library</h2><p>Please refresh the page in a moment.</p></div> : !loading && !products.length ? <div className="catalog-no-results"><h2>New mockups are on the way</h2></div> : <div className="mockup-grid">{visible.map((product) => <ProductCard product={product} key={product.sku} />)}</div>}</section>;
}
