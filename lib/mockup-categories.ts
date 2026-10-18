import type { CatalogProduct } from "@/lib/catalog-seo";

export type MockupCategory = {
  slug: string;
  label: string;
  title: string;
  description: string;
  intro: string;
};

const establishedCategories: Record<string, Omit<MockupCategory, "slug">> = {
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

export function mockupCategorySlug(product: CatalogProduct): string {
  const code = product.category.toUpperCase();
  // Preserve the existing Shirts → Apparel route; every other new code gets its own category.
  if (["SHI", "TSH"].includes(code)) return "apparel";
  if (code === "MUG") return "mugs";

  const slug = (product.categoryName || code).normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // Keep custom categories distinct from the two established groups and the All route.
  return slug && !["all", "apparel", "mugs"].includes(slug) ? slug : `${slug || "category"}-${code.toLowerCase()}`;
}

export function getMockupCategories(products: CatalogProduct[]): MockupCategory[] {
  const categories = new Map<string, MockupCategory>();
  for (const product of products) {
    const slug = mockupCategorySlug(product);
    if (categories.has(slug)) continue;
    if (establishedCategories[slug]) {
      categories.set(slug, { slug, ...establishedCategories[slug] });
      continue;
    }

    const label = product.categoryName?.trim() || product.category;
    categories.set(slug, {
      slug,
      label,
      title: `${label} Video Mockups for POD Sellers`,
      description: `Browse ${label.toLowerCase()} video mockups for print-on-demand sellers. Create product videos and still images for marketplace listings and online stores.`,
      intro: `Explore ${label.toLowerCase()} video mockups for your print-on-demand products. Add your artwork and create videos and still images for Etsy, eBay, Shopify, WooCommerce, and your own store—without filming every item.`,
    });
  }
  const priority: Record<string, number> = { apparel: 0, mugs: 1 };
  return [...categories.values()].sort((a, b) =>
    (priority[a.slug] ?? 2) - (priority[b.slug] ?? 2) || a.label.localeCompare(b.label)
  );
}

export function matchesMockupCategory(product: CatalogProduct, slug: string): boolean {
  return mockupCategorySlug(product) === slug;
}
