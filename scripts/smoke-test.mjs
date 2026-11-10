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
  '/lich-chieu/momo/',
  '/phim/chi-tiet/',
  '/rap/chi-tiet/',
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
assert.ok(home.includes('data-live-movie-catalog'), 'Live film discovery missing on homepage');
assert.ok(home.includes('href="' + base + 'favicon.svg'), 'Favicon not Pages-base-aware');
assert.ok(home.includes('href="' + base + '_astro/') || home.includes('src="' + base + '_astro/'), 'Astro assets not Pages-base-aware');
assert.ok(existsSync('dist/_astro'), 'Astro assets directory missing');
console.log('PASS: base ' + base + ' and assets; static-site smoke tests completed');

const movieDetail = readFileSync('dist/phim/chi-tiet/index.html', 'utf8');
const cinemaDetail = readFileSync('dist/rap/chi-tiet/index.html', 'utf8');
assert.ok(movieDetail.includes('data-film-content'), 'Movie detail shell missing');
assert.ok(cinemaDetail.includes('data-cinema-content'), 'Cinema detail shell missing');
assert.ok(home.includes('section--featured'), 'Now-showing must be the first home section');
assert.ok(!home.includes('class="hero"'), 'Redundant homepage hero must stay removed');
console.log('PASS: real detail routes and movie-first homepage');
