import type { APIRoute } from 'astro';
import { SEO_INDEXING_ENABLED, SITE_ORIGIN } from '../lib/seo.js';

export const GET: APIRoute = () => {
  // Allow crawling so robots meta noindex can be observed on preview/demo pages.
  const lines = ['User-agent: *', 'Allow: /'];
  if (SEO_INDEXING_ENABLED) lines.push('Sitemap: ' + SITE_ORIGIN + '/sitemap.xml');
  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
