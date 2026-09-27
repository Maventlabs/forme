import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private app surfaces and APIs must not be crawled. Note:
      // `/workspace/` (trailing slash) blocks project workspaces while the
      // exact public `/workspace` marketing page stays allowed.
      disallow: ['/api/', '/projects', '/generator', '/cloning', '/workspace/'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
