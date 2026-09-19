export type PurchaseProvider = "NONE" | "PADDLE" | "LEMONSQUEEZY" | "ETSY" | "OTHER";

export type CommerceProduct = {
  purchaseProvider?: PurchaseProvider | string;
  purchaseUrl?: string;
  deliveryUrl?: string;
  etsyUrl?: string;
  priceUsd?: number;
  resolution?: string;
  durationSeconds?: number;
};

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
    price: `$${Number(product.priceUsd ?? 9.9).toFixed(2).replace(/0$/, "")}`,
    resolution: product.resolution || "2000 × 2000",
    duration: `${Number(product.durationSeconds ?? 10)} sec`,
  };
}
