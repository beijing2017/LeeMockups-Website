"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const assetBase = "https://downloads.leemockups.com";
type Product = { sku: string; name: string; description: string; category: string; thumbnailPath: string; previewPath: string; etsyUrl: string; keywords?: string[] };

function ProductCard({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const play = () => videoRef.current?.play().catch(() => undefined);
  const stop = () => { const video = videoRef.current; if (video) { video.pause(); video.currentTime = 0; } };
  return <article className="mockup-card">
    <div className="mockup-card-image" onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop} tabIndex={0}>
      <img src={`${assetBase}/${product.thumbnailPath}`} alt={product.name} loading="lazy" />
      <video ref={videoRef} muted loop playsInline preload="metadata" poster={`${assetBase}/${product.thumbnailPath}`} aria-label={`${product.name} animated preview`}><source src={`${assetBase}/${product.previewPath}`} type="video/webm" /></video>
      <span className="mockup-hover-hint">Hover to preview</span>
    </div>
    <div className="mockup-card-body"><span>{product.category} · VIDEO MOCKUP</span><h2>{product.name}</h2><p>{product.description}</p><div className="mockup-card-actions"><a href={product.etsyUrl} target="_blank" rel="noreferrer">Buy on Etsy →</a><a href="/order-download/">Already purchased? Download →</a></div></div>
  </article>;
}

export function MockupCatalog() {
  const [products, setProducts] = useState<Product[]>([]), [query, setQuery] = useState(""), [loading, setLoading] = useState(true), [failed, setFailed] = useState(false);
  useEffect(() => { fetch(`${assetBase}/catalog/products.json`, { cache: "no-store" }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setProducts(Array.isArray(data?.products) ? data.products : [])).catch(() => setFailed(true)).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => { const value = query.trim().toLowerCase(); return value ? products.filter((product) => [product.name, product.description, product.category, ...(product.keywords || [])].join(" ").toLowerCase().includes(value)) : products; }, [products, query]);
  return <section className="catalog shell" aria-label="Mockup catalog"><div className="catalog-toolbar"><label className="catalog-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search mockups" aria-label="Search mockups" /></label><div className="catalog-count">{loading ? "Loading…" : `${visible.length} mockup${visible.length === 1 ? "" : "s"}`}</div></div>{failed ? <div className="catalog-no-results"><h2>Unable to load the library</h2><p>Please refresh the page in a moment.</p></div> : !loading && !visible.length ? <div className="catalog-no-results"><h2>No mockups found</h2><p>Try another search.</p></div> : <div className="mockup-grid">{visible.map((product) => <ProductCard product={product} key={product.sku} />)}</div>}</section>;
}
