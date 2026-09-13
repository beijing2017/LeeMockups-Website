"use client";

import { useMemo, useState } from "react";
import { assetUrl, type Product } from "@/lib/products";

function MockupCard({ product }: { product: Product }) {
  const [active, setActive] = useState(false);
  const thumbnail = assetUrl(product.thumbnailPath);
  const webm = assetUrl(product.previewPath);
  const mp4 = assetUrl(product.previewMp4Path);
  const canPreview = Boolean(thumbnail && (webm || mp4));
  const canBuy = product.status === "PUBLISHED" && product.purchaseProvider === "etsy" && Boolean(product.etsyUrl);

  return <article className="mockup-card" onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)} onFocus={() => setActive(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(false); }}>
    <div className="mockup-card-image">
      {thumbnail ? <img src={thumbnail} alt={product.title} loading="lazy" /> : <span className="mockup-art-pending">Preview coming soon</span>}
      {canPreview && active && <video autoPlay muted playsInline loop preload="none" poster={thumbnail ?? undefined} aria-label={`${product.title} animated preview`}>
        {webm && <source src={webm} type="video/webm" />}
        {mp4 && <source src={mp4} type="video/mp4" />}
      </video>}
    </div>
    <div className="mockup-card-body">
      <span>{product.type} · {product.category}</span>
      <h2>{product.title}</h2>
      <p>{product.description}</p>
      <div className="mockup-card-actions">
        {canBuy ? <a href={product.etsyUrl!} target="_blank" rel="noopener noreferrer">Buy on Etsy ↗</a> : <span className="mockup-coming-soon">Coming soon</span>}
      </div>
    </div>
  </article>;
}

export default function MockupCatalog({ products }: { products: readonly Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const matches = useMemo(() => products.filter((product) => {
    const text = `${product.title} ${product.description} ${product.sku} ${product.keywords.join(" ")}`.toLowerCase();
    return (category === "All" || product.category === category) && text.includes(query.trim().toLowerCase());
  }), [products, query, category]);

  return <>
    <div className="catalog-toolbar"><label className="catalog-search"><span className="sr-only">Search mockups</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search mockups..." type="search" /></label><span className="catalog-count">{matches.length} mockup{matches.length === 1 ? "" : "s"}</span></div>
    <div className="catalog-categories" aria-label="Filter by category">{categories.map((name) => <button type="button" key={name} className={category === name ? "selected" : ""} aria-pressed={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>
    {matches.length ? <div className="mockup-grid">{matches.map((product) => <MockupCard key={product.id} product={product} />)}</div> : <div className="catalog-no-results"><h2>No mockups found</h2><p>Try another search or category.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>}
  </>;
}
