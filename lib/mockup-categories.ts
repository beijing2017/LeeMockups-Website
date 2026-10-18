import type { CatalogProduct } from "@/lib/catalog-seo";

export type MockupCategory = "apparel" | "mugs";

export const mockupCategories: Record<MockupCategory, {
  label: string;
  title: string;
  description: string;
  intro: string;
}> = {
  apparel: {
    label: "Apparel",
    title: "Apparel Video Mockups for POD Sellers",
    description: "T-shirt and apparel video mockups for print-on-demand sellers. Create product videos and still images for marketplace listings and independent online stores.",
    intro: "Show your print-on-demand T-shirt designs in motion. Create product videos and still images for Etsy and eBay listings or stores built with Shopify and WooCommerce—without filming every item.",
  },
  mugs: {
    label: "Mugs",
    title: "Mug Video Mockups for POD Sellers",
    description: "Mug video mockups for print-on-demand sellers. Create product videos and still images for marketplace listings and independent online stores.",
    intro: "Present your print-on-demand mug designs in motion. Make product videos and still images for Etsy and eBay listings or Shopify and WooCommerce stores—without a product shoot.",
  },
};

export function matchesMockupCategory(product: CatalogProduct, category: MockupCategory): boolean {
  if (category === "mugs") return product.category === "MUG";
  return ["SHI", "TSH", "HOO"].includes(product.category) ||
    /\b(apparel|t-?shirts?|hoodies?|sweatshirts?)\b/i.test(product.categoryName ?? "");
}
