export type PurchaseProvider = "NONE" | "CREEM" | "LEMONSQUEEZY" | "ETSY" | "OTHER";

export type CommerceProduct = {
  sku?: string;
  purchaseProvider?: PurchaseProvider | string;
  purchaseUrl?: string;
  deliveryUrl?: string;
  etsyUrl?: string;
  priceUsd?: number;
  resolution?: string;
  durationSeconds?: number;
};

export function resolvePriceUsd(product: CommerceProduct) {
  return Number(product.sku === "LM-VM-MUG-001" ? 3.49 : (product.priceUsd ?? 3.49));
}

export function resolveCommerce(product: CommerceProduct) {
  const provider = String(product.purchaseProvider || (product.etsyUrl ? "ETSY" : "NONE")).toUpperCase() as PurchaseProvider;
  const purchaseUrl = String(product.purchaseUrl || product.etsyUrl || "").trim();
  const deliveryUrl = String(product.deliveryUrl || (provider === "ETSY" && purchaseUrl ? "/order-download/" : "")).trim();
  return {
    provider,
    purchaseUrl,
    deliveryUrl,
    available: Boolean(purchaseUrl),
    buttonLabel: "Buy now",
    price: `$${resolvePriceUsd(product).toFixed(2)}`,
    launchSpecial: product.sku === "LM-VM-MUG-001",
    resolution: product.resolution || "2000 × 2000",
    duration: `${Number(product.durationSeconds ?? 10)} sec`,
  };
}
