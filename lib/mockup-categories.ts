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
    title: "Apparel Video Mockups",
    description: "Explore apparel video mockups for print-on-demand listings. Preview T-shirt designs in motion and create product videos and still images with LeeMockups.",
    intro: "Show your apparel designs in motion. Browse video mockups for T-shirts and create product videos and still images for your listings without filming each item.",
  },
  mugs: {
    label: "Mugs",
    title: "Mug Video Mockups",
    description: "Explore mug video mockups for print-on-demand listings. Add your artwork and create product videos and still images with LeeMockups.",
    intro: "Preview your artwork on mugs in motion. Choose a video mockup and create product videos and still images for your listings without filming each item.",
  },
};

export function matchesMockupCategory(product: CatalogProduct, category: MockupCategory): boolean {
  if (category === "mugs") return product.category === "MUG";
  return ["SHI", "TSH", "HOO"].includes(product.category) ||
    /\b(apparel|t-?shirts?|hoodies?|sweatshirts?)\b/i.test(product.categoryName ?? "");
}
