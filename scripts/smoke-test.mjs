import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const requiredRoutes = [
  '/',
  '/phim-dang-chieu/',
  '/phim-sap-chieu/',
  '/lich-chieu/',
  '/rap/',
  '/phim/sau-anh-hoang-hon/',
  '/rap/cgv-vincom-dong-khoi/',
];

for (const route of requiredRoutes) {
  const file = join('dist', route, 'index.html');
  assert.ok(existsSync(file), `Missing static page: ${route} (${file})`);
  const html = readFileSync(file, 'utf8');
  assert.match(html, /<html\s+lang="vi">/, `Missing Vietnamese language marker: ${route}`);
  assert.match(html, /noindex, nofollow/, `Demo route unexpectedly indexable: ${route}`);
  assert.match(html, /ePlus Cinema|ePlus <strong>Cinema<\/strong>/, `Page missing branding: ${route}`);
  console.log(`PASS ${route}`);
}
const headers = join('dist', '_headers');
assert.ok(existsSync(headers), 'Cloudflare Pages _headers did not make it into dist/');
assert.match(readFileSync(headers, 'utf8'), /X-Robots-Tag:\s*noindex/, 'Demo deployment must not be indexed');
console.log('PASS Cloudflare headers; all preview pages verified');
