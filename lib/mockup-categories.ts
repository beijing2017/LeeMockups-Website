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
    description: "T-shirt and apparel video mockups for print-on-demand (POD) sellers. Show your designs in Etsy listings and Shopify stores with product videos and still images.",
    intro: "Show your print-on-demand T-shirt designs in motion. Create product videos and still images for Etsy listings, Shopify stores, or your own storefront—without filming every item.",
  },
  mugs: {
    label: "Mugs",
    title: "Mug Video Mockups for POD Sellers",
    description: "Mug video mockups for print-on-demand (POD) sellers. Create product videos and still images to present your designs in Etsy listings and Shopify stores.",
    intro: "Present your print-on-demand mug designs with video mockups. Turn your artwork into product videos and still images for Etsy listings and Shopify stores—without a product shoot.",
  },
};

export function matchesMockupCategory(product: CatalogProduct, category: MockupCategory): boolean {
  if (category === "mugs") return product.category === "MUG";
  return ["SHI", "TSH", "HOO"].includes(product.category) ||
    /\b(apparel|t-?shirts?|hoodies?|sweatshirts?)\b/i.test(product.categoryName ?? "");
}
