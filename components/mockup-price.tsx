import { resolveCommerce, type CommerceProduct } from "@/lib/commerce";

export function MockupPrice({ product }: { product: CommerceProduct & { isFree?: boolean } }) {
  const commerce = resolveCommerce(product);
  const onSale = !product.isFree && commerce.launchSpecial;
  return <div className="mockup-price">
    <strong>{product.isFree ? "Free" : commerce.price}</strong>
    {onSale && <>
      <s className="mockup-original-price" aria-label={`Regular price ${commerce.regularPrice}`}>{commerce.regularPrice}</s>
      <span className="launch-badge">Launch Special</span>
    </>}
  </div>;
}
