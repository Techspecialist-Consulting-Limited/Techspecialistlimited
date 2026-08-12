import type { MetadataRoute } from 'next';
import { caseStudies } from '@/data/case-studies';
import { blogPosts } from '@/data/blog';

const BASE_URL = 'https://techspecialistlimited.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/services`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/case-studies`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/insights`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/careers`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/consultation`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/ai-readiness-assessment`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const caseStudyRoutes: MetadataRoute.Sitemap = caseStudies.map((cs) => ({
    url: `${BASE_URL}/case-studies/${cs.id}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const insightRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/insights/${post.slug}`,
    lastModified: new Date(post.published),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...caseStudyRoutes, ...insightRoutes];
}
