import { MetadataRoute } from 'next';
import { blogPosts } from '@/data/blog';
import { docPages } from '@/data/docs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aevon.ink';

  const staticRoutes = [
    '',
    '/docs',
    '/blog',
    '/login',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date).toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const docRoutes = docPages.map((page) => ({
    url: `${baseUrl}/docs/${page.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...docRoutes];
}
