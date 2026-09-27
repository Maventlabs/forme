import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

// Public marketing pages only. Authenticated app routes (/projects,
// /workspace/[projectId], /generator, /cloning) and /api/* are intentionally
// excluded: they redirect without a session and must not be indexed.
const publicRoutes: Array<{
  path: string
  changeFrequency: 'daily' | 'weekly' | 'monthly'
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/product', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/workflow', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/workspace', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/design-md', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/crawl', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/mavent-products', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const lastModified = new Date()
  return publicRoutes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
