import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.leemockups.com';
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/help/`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/mockups/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/mockup/`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/terms/`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/privacy/`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/refunds/`, changeFrequency: 'yearly', priority: 0.4 },
  ];
}
