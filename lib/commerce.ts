export type PurchaseProvider = "NONE" | "PADDLE" | "CREEM" | "LEMONSQUEEZY" | "ETSY" | "OTHER";

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

const REGULAR_PRICE_USD = 2;
const LAUNCH_PRICE_USD = 3.49;

export function resolvePriceUsd(product: CommerceProduct) {
  return Number(product.priceUsd ?? REGULAR_PRICE_USD);
}

export function resolveCommerce(product: CommerceProduct) {
  const configuredProvider = String(product.purchaseProvider || "NONE").toUpperCase() as PurchaseProvider;
  const provider = configuredProvider === "ETSY" ? "NONE" : configuredProvider;
  const purchaseUrl = configuredProvider === "ETSY" ? "" : String(product.purchaseUrl || "").trim();
  const deliveryUrl = configuredProvider === "ETSY" ? "" : String(product.deliveryUrl || "").trim();
  return {
    provider,
    purchaseUrl,
    deliveryUrl,
    available: Boolean(purchaseUrl),
    buttonLabel: "Buy now",
    price: `$${resolvePriceUsd(product).toFixed(2)}`,
    regularPrice: `$${REGULAR_PRICE_USD.toFixed(2)}`,
    launchSpecial: provider === "CREEM" && LAUNCH_PRICE_USD < REGULAR_PRICE_USD && resolvePriceUsd(product) === LAUNCH_PRICE_USD,
    resolution: product.resolution || "2000 × 2000",
    duration: `${Number(product.durationSeconds ?? 10)} sec`,
  };
}
