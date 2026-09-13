import registry from "../data/products.json";

export type ProductStatus = "DRAFT" | "READY" | "PUBLISHED" | "ARCHIVED";
export type Product = {
  sku: string;
  displayName: string;
  fullName: string;
  category: string;
  type: string;
  motion: string;
  color: string;
  scene: string;
  style: string;
  status: ProductStatus;
  thumbnailPath: string;
  previewPath: string;
  etsyUrl: string;
  purchaseProvider: string;
  primaryKeyword: string;
  keywords: string[];
  detailPageEnabled: boolean;
};

export const publishedProducts = (registry.products as Product[]).filter(
  (product) => product.status === "PUBLISHED" && product.thumbnailPath && product.previewPath,
);

export function assetUrl(path: string): string {
  const base = process.env.ASSET_BASE_URL?.replace(/\/$/, "");
  if (!base || !/^https:\/\//.test(base)) return "";
  return `${base}/${path.replace(/^\/+/, "")}`;
}
