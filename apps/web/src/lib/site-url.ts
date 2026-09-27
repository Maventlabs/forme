// Canonical public site URL for SEO artifacts (sitemap, robots).
// Never throws: falls back safely so `next build` page-data collection
// works even when no production URL is configured yet.
export function getSiteUrl(): string {
  const fallback = 'http://localhost:3100'
  const raw = (process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? fallback).trim()
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback
    return url.origin
  } catch {
    return fallback
  }
}
