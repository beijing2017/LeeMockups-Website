export const mockupCategories = ["All", "Mugs", "Apparel", "Prints", "Devices", "Packaging"] as const;

export type MockupCategory = Exclude<(typeof mockupCategories)[number], "All">;

export type PublicMockup = {
  slug: string;
  title: string;
  category: MockupCategory;
  description: string;
  image: string;
  imageAlt: string;
  etsyUrl: string;
  detailUrl?: string;
};

// Only add published products with approved public imagery and a live Etsy listing.
// Never put private R2 object keys, download URLs, or purchase records here.
export const publicMockups: PublicMockup[] = [];
