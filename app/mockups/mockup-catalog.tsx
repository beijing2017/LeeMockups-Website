"use client";

import { useEffect, useRef, useState } from "react";

const assetBase = "https://downloads.leemockups.com";
type Product = { sku: string; name: string; description: string; category: string; thumbnailPath: string; previewPath: string; etsyUrl: string; keywords?: string[]; assetVersion?: string };

function ProductCard({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const play = () => videoRef.current?.play().catch(() => undefined);
  const stop = () => { const video = videoRef.current; if (video) { video.pause(); video.currentTime = 0; } };
  return <article className="mockup-card">
    <div className="mockup-card-image" onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop} tabIndex={0}>
      <img src={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} alt={product.name} loading="lazy" draggable={false} />
      <video ref={videoRef} muted loop playsInline preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture draggable={false} onContextMenu={(event) => event.preventDefault()} poster={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} aria-label={`${product.name} animated preview`}><source src={`${assetBase}/${product.previewPath}?v=${encodeURIComponent(product.assetVersion || "1")}`} type="video/webm" /></video>
    </div>
    <div className="mockup-card-body"><h2>{product.name}</h2><p>{product.description}</p><div className="mockup-card-actions"><a className="mockup-buy-button" href={product.etsyUrl} target="_blank" rel="noreferrer">Buy on Etsy</a><a href="/order-download/">Already purchased? Download →</a></div></div>
  </article>;
}

export function MockupCatalog() {
  const [products, setProducts] = useState<Product[]>([]), [loading, setLoading] = useState(true), [failed, setFailed] = useState(false);
  useEffect(() => { fetch(`${assetBase}/catalog/products.json`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setProducts(Array.isArray(data?.products) ? data.products.map((product: Product) => ({ ...product, assetVersion: data.updatedAt })) : [])).catch(() => setFailed(true)).finally(() => setLoading(false)); }, []);
  return <section className="catalog shell" aria-label="Mockup catalog">{failed ? <div className="catalog-no-results"><h2>Unable to load the library</h2><p>Please refresh the page in a moment.</p></div> : !loading && !products.length ? <div className="catalog-no-results"><h2>New mockups are on the way</h2></div> : <div className="mockup-grid">{products.map((product) => <ProductCard product={product} key={product.sku} />)}</div>}</section>;
}
