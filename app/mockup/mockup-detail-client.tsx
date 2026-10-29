"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Play } from "lucide-react";
import { resolveCommerce, resolvePriceUsd } from "@/lib/commerce";
import { MockupPrice } from "@/components/mockup-price";
import { PurchaseAction } from "@/components/purchase-action";
import { trackEvent } from "@/lib/marketing-attribution";
import type { CatalogProduct as Product } from "@/lib/catalog-seo";

const assetBase = "https://downloads.leemockups.com";
type GalleryItem = { type:"image"|"video"; path:string; alt?:string };
export function MockupDetailClient({ sku, initialProduct }: { sku: string; initialProduct?: Product }) {
  const [products, setProducts] = useState<Product[]>(initialProduct ? [initialProduct] : []);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [loading, setLoading] = useState(!initialProduct);
  const [failed, setFailed] = useState(false);
  useEffect(() => { fetch(`${assetBase}/catalog/products.json`, { cache:"no-store" }).then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then((data) => setProducts(Array.isArray(data?.products) ? data.products.map((item:Product) => ({...item,assetVersion:data.updatedAt})) : [])).catch(() => { if (!initialProduct) setFailed(true); }).finally(() => setLoading(false)); }, [initialProduct]);
  const product = useMemo(() => products.find((item) => item.sku === sku), [products, sku]);
  const freeSample = useMemo(() => products.find((item) => item.isFree), [products]);
  useEffect(() => {
    if (product) trackEvent("view_item", { items:[{ item_id:product.sku, item_name:product.name, price:resolvePriceUsd(product) }] });
  }, [product]);
  if (loading) return <div className="mockup-detail-state shell">Loading mockup details…</div>;
  if (failed || !product) return <div className="mockup-detail-state shell"><h1>Mockup not found</h1><p>The product may have moved or the library could not be loaded.</p><Link className="button secondary" href="/mockups/">Back to Mockup Library</Link></div>;
  const commerce = resolveCommerce(product);
  const included = [`One ${commerce.resolution}, ${commerce.duration.replace(" sec", "-second")} MP4 video`, "Five matching still images"];
  const gallery:GalleryItem[] = product.gallery?.length ? product.gallery : [{type:"image",path:product.thumbnailPath,alt:product.name},{type:"video",path:product.previewPath,alt:`${product.name} video preview`}];
  const activeMedia = gallery[Math.min(selectedMedia, gallery.length - 1)];
  const fallbackProvider=product.sku==="LM-VM-MUG-001"?"CREEM":"";
  const purchaseProvider=product.sku==="LM-VM-MUG-001"?"CREEM":commerce.provider!=="NONE"?commerce.provider:fallbackProvider;
  const providerProductId=product.providerProductId||(purchaseProvider==="CREEM"&&product.sku==="LM-VM-MUG-001"?"prod_1jYFUPxAzPuJQtKJL2SEe3":"");
  const purchasePanel = <aside className="mockup-purchase-panel"><div className="mockup-purchase-meta"><MockupPrice product={product}/><div><small>{commerce.resolution}</small><small>{commerce.duration}</small></div></div><small>Digital product · No physical item</small>{product.isFree?<a className="button primary purchase-primary purchased" href={`/composer/?sku=${encodeURIComponent(product.sku)}`}><Play size={17}/> Create video online</a>:<PurchaseAction provider={purchaseProvider} providerProductId={providerProductId} purchaseUrl={commerce.purchaseUrl} sku={product.sku}/>} {!product.isFree && <p>Review the <Link href="/refunds/">refund policy</Link> before purchasing.</p>}</aside>;
  return <>
    <section className="mockup-product-hero shell"><div className="mockup-gallery"><div className="mockup-gallery-thumbs" aria-label="Product media">{gallery.map((item,index)=><button type="button" className={index===selectedMedia?"selected":""} onClick={()=>setSelectedMedia(index)} aria-label={`Show ${item.type} ${index+1}`} key={`${item.path}-${index}`}>{item.type==="video"?<><video muted preload="metadata" poster={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion||"1")}`}><source src={`${assetBase}/${item.path}?v=${encodeURIComponent(product.assetVersion||"1")}`} /></video><Play size={16}/></>:<img src={`${assetBase}/${item.path}?v=${encodeURIComponent(product.assetVersion||"1")}`} alt="" loading="lazy"/>}</button>)}</div><div className="mockup-product-media" onContextMenu={(event)=>event.preventDefault()}>{activeMedia.type==="video"?<video key={activeMedia.path} muted loop playsInline autoPlay preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture poster={`${assetBase}/${product.thumbnailPath}?v=${encodeURIComponent(product.assetVersion||"1")}`}><source src={`${assetBase}/${activeMedia.path}?v=${encodeURIComponent(product.assetVersion||"1")}`} /></video>:<img src={`${assetBase}/${activeMedia.path}?v=${encodeURIComponent(product.assetVersion||"1")}`} alt={activeMedia.alt||product.name}/>} {product.isFree&&<span className="mockup-free-badge">FREE</span>}</div></div><div className="mockup-product-summary"><Link className="mockup-back" href="/mockups/">← Mockup Library</Link><h1>{product.name}</h1>{purchasePanel}</div></section>
    <section className="mockup-product-content shell"><div className="mockup-info-main">
      <p>{product.description}</p>
      <section><span className="mockup-section-kicker">WHAT YOU RECEIVE</span><h2>Everything included</h2><ul className="mockup-check-list">{included.map((item)=><li key={item}><Check size={17}/>{item}</li>)}</ul></section>
      <section><span className="mockup-section-kicker">HOW IT WORKS</span><h2>Three simple steps</h2><ol className="mockup-steps"><li><b>1</b><div><strong>Open the online creator</strong><p>{product.isFree ? "Select Create video online above to get started." : "Purchase this mockup, then open the creator from your verified order."}</p></div></li><li><b>2</b><div><strong>Add your design</strong><p>Choose a PNG or JPG, adjust its placement, and check the live preview.</p></div></li><li><b>3</b><div><strong>Save your files</strong><p>Create the MP4 and five matching still images, then save them to your device.</p></div></li></ol></section>
      {!product.isFree && <section><span className="mockup-section-kicker">BEFORE YOU BUY</span><h2>Important product details</h2><div className="expectation-grid"><div><Play/><strong>Prepared animation</strong><p>Artwork placement, camera movement, and animation are preset.</p></div></div></section>}
      {!product.isFree && <section><span className="mockup-section-kicker">TRY BEFORE PURCHASING</span><h2>Test the workflow first</h2><p>Use a free mockup to check artwork import, browser generation, and output quality before buying.</p>{freeSample&&<Link className="button secondary" href={`/mockup/${encodeURIComponent(freeSample.sku)}/`}>View free mockup</Link>}</section>}
    </div></section>
  </>;
}

