import type { MetadataRoute } from 'next';
import { db, safeQuery } from '@/lib/db';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Карта сайта. Статические разделы плюс все видимые проекты и объекты.
 * Если база недоступна, отдаём хотя бы статические страницы —
 * пустой sitemap лучше пятисотки.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/catalog`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/works`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/production`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.1 },
  ];

  const [projects, works] = await Promise.all([
    safeQuery(
      'sitemapProjects',
      () =>
        db.project.findMany({
          where: { visible: true },
          select: { slug: true, updatedAt: true },
          orderBy: { sortOrder: 'asc' },
        }),
      [],
    ),
    safeQuery(
      'sitemapWorks',
      () =>
        db.work.findMany({
          where: { visible: true },
          select: { slug: true, updatedAt: true },
          orderBy: { sortOrder: 'asc' },
        }),
      [],
    ),
  ]);

  return [
    ...staticPages,
    ...projects.map((project) => ({
      url: `${siteUrl}/catalog/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...works.map((work) => ({
      url: `${siteUrl}/works/${work.slug}`,
      lastModified: work.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
