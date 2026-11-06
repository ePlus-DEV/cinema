#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const baseSegment = (process.env.PAGES_BASE_PATH || '/').split('/').filter(Boolean).join('/');
const base = baseSegment ? '/' + baseSegment + '/' : '/';

const routes = [
  '/',
  '/phim-dang-chieu/',
  '/phim-sap-chieu/',
  '/lich-chieu/',
  '/rap/',
  '/phim/sau-anh-hoang-hon/',
  '/rap/cgv-vincom-dong-khoi/'
];

for (const route of routes) {
  const path = join('dist', route.replace(/^\/+/, ''), 'index.html');
  assert.ok(existsSync(path), 'Missing static page: ' + route);
  const html = readFileSync(path, 'utf8');
  assert.match(html, /<html\s+lang="vi">/, 'Missing Vietnamese language declaration: ' + route);
  assert.match(html, /noindex,\s*nofollow/, 'Demo page must stay noindex: ' + route);
  assert.ok(html.includes('<title>'), 'Missing title: ' + route);
  console.log('PASS: ' + route);
}
const home = readFileSync('dist/index.html', 'utf8');
assert.ok(home.includes('href="' + base + 'phim-dang-chieu'), 'Movie navigation not Pages-base-aware');
assert.ok(home.includes('action="' + base + 'phim-dang-chieu'), 'Search form not Pages-base-aware');
assert.ok(home.includes('href="' + base + 'favicon.svg'), 'Favicon not Pages-base-aware');
assert.ok(home.includes('href="' + base + '_astro/') || home.includes('src="' + base + '_astro/'), 'Astro assets not Pages-base-aware');
assert.ok(existsSync('dist/_astro'), 'Astro assets directory missing');
console.log('PASS: base ' + base + ' and assets; static-site smoke tests completed');
