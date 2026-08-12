import type { MetadataRoute } from 'next';

const BASE_URL = 'https://techspecialistlimited.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/hr',
          '/hr/',
          '/admin',
          '/admin/',
          '/api/',
          '/assessment/',
          '/application-status/',
          '/apply',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
