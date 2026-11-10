import type { APIRoute } from 'astro';
import { SEO_INDEXABLE_PATHS, SEO_INDEXING_ENABLED, seoCanonical, xmlEscape } from '../lib/seo.js';

// Deliberately exclude sample slugs, unrendered query-detail pages and aliases.
// An empty sitemap is shipped while SEO_INDEXABLE is off; no unlicensed content
// is accidentally advertised to search engines.
export const GET: APIRoute = () => {
  const urls = SEO_INDEXING_ENABLED ? SEO_INDEXABLE_PATHS : [];
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((path) => '  <url><loc>' + xmlEscape(seoCanonical(path)) + '</loc></url>').join('\n')
    + '\n</urlset>\n';
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
