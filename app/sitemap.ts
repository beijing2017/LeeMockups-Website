import type { MetadataRoute } from 'next';
import { getSeoCatalog, productUrl } from '@/lib/catalog-seo';
import { getMockupCategories } from '@/lib/mockup-categories';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.leemockups.com';
  const products = await getSeoCatalog();
  const categoryPages = getMockupCategories(products).map(({ slug }) => ({
    url: `${base}/mockups/${slug}/`, changeFrequency: 'weekly' as const, priority: 0.7,
  }));
  const productPages = products.map((product) => ({
    url: productUrl(product.sku), changeFrequency: 'weekly' as const, priority: 0.7,
  }));
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/help/`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/mockups/`, changeFrequency: 'weekly', priority: 0.8 },
    ...categoryPages,
    ...productPages,
    { url: `${base}/terms/`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/privacy/`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/refunds/`, changeFrequency: 'yearly', priority: 0.4 },
  ];
}
