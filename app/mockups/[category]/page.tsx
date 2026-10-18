import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { getSeoCatalogData } from "@/lib/catalog-seo";
import { matchesMockupCategory, mockupCategories, type MockupCategory } from "@/lib/mockup-categories";
import { MockupCatalog } from "../mockup-catalog";

type PageProps = { params: Promise<{ category: string }> };

function isMockupCategory(value: string): value is MockupCategory {
  return value === "apparel" || value === "mugs";
}

export function generateStaticParams() {
  return Object.keys(mockupCategories).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  if (!isMockupCategory(category)) return {};
  const config = mockupCategories[category];
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: `/mockups/${category}/` },
  };
}

export default async function MockupCategoryPage({ params }: PageProps) {
  const { category } = await params;
  if (!isMockupCategory(category)) notFound();
  const config = mockupCategories[category];
  const [headingStart, headingEnd] = config.title.split(" for ");
  const { products, homeFeaturedSkus } = await getSeoCatalogData();
  const categoryProducts = products.filter((product) => matchesMockupCategory(product, category));
  return <main className="mockups-page">
    <SiteNav current="mockups" />
    <section className="mockups-hero mockups-category-hero">
      <div className="shell mockups-hero-layout"><div className="mockups-hero-copy"><span className="mockups-eyebrow">LEEMOCKUPS COLLECTION</span><h1>{headingStart}<br />{" for "}{headingEnd}</h1><p>{config.intro}</p></div><div className="mockups-hero-art" aria-hidden="true"><Image src="/mockup-library-hero.png" width={1200} height={1200} alt="" priority /></div></div>
    </section>
    <MockupCatalog seoSkus={products.map((product) => product.sku)} initialProducts={categoryProducts} initialHomeFeaturedSkus={homeFeaturedSkus} categoryGroup={category} />
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
