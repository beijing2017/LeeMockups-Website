"use client";
import { useRef } from "react";
import type { Product } from "../lib/products";

export function MockupCard({ product, thumbnail, preview }: { product: Product; thumbnail: string; preview: string }) {
  const video = useRef<HTMLVideoElement>(null);
  function play() { if (!video.current || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return; video.current.currentTime = 0; void video.current.play().catch(() => {}); }
  function stop() { if (!video.current) return; video.current.pause(); video.current.currentTime = 0; }
  return <article className="library-product" onMouseEnter={play} onMouseLeave={stop}>
    <div className="library-product-art">
      {thumbnail && <img src={thumbnail} alt={product.fullName} width="500" height="500" loading="lazy" />}
      {preview && <video ref={video} src={preview} poster={thumbnail} muted playsInline preload="none" aria-hidden="true" />}
    </div>
    <div className="library-product-body"><span>{product.category}</span><h2>{product.displayName}</h2><p>{product.fullName}</p>
      {product.purchaseProvider === "ETSY" && product.etsyUrl && <a href={product.etsyUrl} target="_blank" rel="noopener noreferrer">Buy on Etsy →</a>}
    </div>
  </article>;
}
