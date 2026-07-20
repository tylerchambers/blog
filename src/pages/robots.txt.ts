import { SITE } from '../config/site';

export function GET(context: { site?: URL }) {
  const site = context.site ?? new URL(SITE.url);
  const sitemapUrl = new URL('/sitemap-index.xml', site);

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
