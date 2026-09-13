export type ProductStatus = "DRAFT" | "READY" | "PUBLISHED";
export type PurchaseProvider = "etsy" | null;

export type Product = {
  id: string; // Permanent internal identity; never derived from the display name.
  sku: string; // Permanent public identity; never reused, including after withdrawal.
  title: string;
  category: "Mugs";
  type: "Video Mockup";
  description: string;
  status: ProductStatus;
  thumbnailPath: string | null;
  previewPath: string | null; // WebM asset path.
  previewMp4Path: string | null;
  etsyUrl: string | null;
  purchaseProvider: PurchaseProvider;
  keywords: string[];
  detailPageEnabled: boolean;
};

export const products: readonly Product[] = [
  {
    id: "d8103d88-e0b3-4574-91a1-e140f1b9c001",
    sku: "LM-VM-MUG-001",
    title: "Floating Black Mug Video Mockup",
    category: "Mugs",
    type: "Video Mockup",
    description: "An animated black mug mockup for product listings and presentations.",
    status: "DRAFT",
    thumbnailPath: null,
    previewPath: null,
    previewMp4Path: null,
    etsyUrl: null,
    purchaseProvider: null,
    keywords: ["black mug", "floating mug", "animated mug", "video mockup"],
    detailPageEnabled: false,
  },
];

const skuPattern = /^LM-VM-([A-Z]+)-(\d{3,})$/;

export function nextSku(categoryCode: string, existing: readonly Product[] = products): string {
  if (!/^[A-Z]+$/.test(categoryCode)) throw new Error("Invalid category code");
  const used = existing
    .map((product) => product.sku.match(skuPattern))
    .filter((match): match is RegExpMatchArray => Boolean(match && match[1] === categoryCode))
    .map((match) => Number(match[2]));
  return `LM-VM-${categoryCode}-${String(Math.max(0, ...used) + 1).padStart(3, "0")}`;
}

export function assertUniqueProduct(candidate: Product, existing: readonly Product[] = products): void {
  if (existing.some((product) => product.id === candidate.id || product.sku === candidate.sku)) {
    throw new Error(`Duplicate product ID or SKU: ${candidate.sku}`);
  }
}

export function assetUrl(path: string | null): string | null {
  if (!path) return null;
  if (!/^\/mockups\/[A-Z0-9-]+\/[a-z0-9-]+\.(webp|png|jpg|webm|mp4)$/.test(path)) {
    throw new Error(`Invalid mockup asset path: ${path}`);
  }
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/+$/, "");
  return base ? `${base}${path}` : null;
}
