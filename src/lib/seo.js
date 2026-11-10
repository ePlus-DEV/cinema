// SEO launch switch: explicit opt-in, and never index GitHub Pages PR previews.
// Static demo/movie/cinema query-detail URLs are deliberately absent.
export const SEO_INDEXABLE_PATHS = Object.freeze([
  '/',
  '/phim-dang-chieu/',
  '/phim-sap-chieu/',
  '/lich-chieu/',
  '/rap/'
]);

export const SITE_ORIGIN = (process.env.PAGES_SITE_ORIGIN || 'https://cinema.eplus.dev')
  .replace(/\/+$/, '');

export const IS_PRODUCTION_BASE = (process.env.PAGES_BASE_PATH || '/')
  .split('/').filter(Boolean).length === 0;

export const SEO_INDEXING_ENABLED =
  process.env.SEO_INDEXABLE === 'true' && IS_PRODUCTION_BASE;

export function seoCanonical(pathname) {
  const path = '/' + String(pathname || '/').replace(/^\/+|\/+$/g, '');
  return SITE_ORIGIN + (path === '/' ? '/' : path + '/');
}

export function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (s) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[s]);
}
