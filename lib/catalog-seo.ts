export const catalogAssetBase = "https://downloads.leemockups.com";

export type CatalogProduct = {
  sku: string;
  name: string;
  description: string;
  category: string;
  thumbnailPath: string;
  previewPath: string;
  gallery?: { type: "image" | "video"; path: string; alt?: string }[];
  purchaseProvider?: string;
  providerProductId?: string;
  purchaseUrl?: string;
  deliveryUrl?: string;
  etsyUrl?: string;
  priceUsd?: number;
  resolution?: string;
  durationSeconds?: number;
  isFree?: boolean;
  sampleUrl?: string;
  supportedPlatforms?: string;
  includedFiles?: string[];
  keywords?: string[];
  assetVersion?: string;
};

let catalogPromise: Promise<CatalogProduct[]> | undefined;

export function getSeoCatalog(): Promise<CatalogProduct[]> {
  catalogPromise ??= fetch(`${catalogAssetBase}/catalog/products.json?seo-build=${Date.now()}`, {
    cache: "force-cache",
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Product catalog returned ${response.status}`);
    const catalog = await response.json();
    if (!Array.isArray(catalog?.products)) throw new Error("Invalid product catalog");
    return catalog.products.filter((product: CatalogProduct) =>
      /^LM-VM-[A-Z]{3}-\d{3}$/.test(product.sku) &&
      Boolean(product.name && product.thumbnailPath && product.previewPath)
    ).map((product: CatalogProduct) => ({ ...product, assetVersion: catalog.updatedAt }));
  });
  return catalogPromise;
}

export function productUrl(sku: string): string {
  return `https://www.leemockups.com/mockup/${encodeURIComponent(sku)}/`;
}
