#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const origin = (process.env.PAGES_SITE_ORIGIN || 'https://cinema.eplus.dev').replace(/\/+$/, '');
const buildBase = (process.env.PAGES_BASE_PATH || '/').replace(/^\/+|\/+$/g, '');
const indexable = process.env.SEO_INDEXABLE === 'true' && !buildBase;
const stablePaths = ['/', '/phim-dang-chieu/', '/phim-sap-chieu/', '/lich-chieu/', '/rap/'];
const staticMovies = readdirSync('dist/phim').filter(s => /^[1-9][0-9]*$/.test(s)).slice(0, 3).map(id => '/phim/' + id + '/');
const staticCinemas = readdirSync('dist/rap').filter(s => /^[1-9][0-9]*-[a-zA-Z0-9_-]+$/.test(s)).slice(0, 3).map(id => '/rap/' + id + '/');
const extraPaths = ['/lich-chieu/momo/', '/phim/chi-tiet/', '/rap/chi-tiet/', ...staticMovies, ...staticCinemas];
const pathToUrl = (route) => origin + route;
const htmlFor = (route) => readFileSync(join('dist', route.replace(/^\/+/, ''), 'index.html'), 'utf8');
const matchAttribute = (html, pattern) => html.match(pattern)?.[1] ?? null;

for (const route of [...stablePaths, ...extraPaths]) {
  const html = htmlFor(route);
  const robots = matchAttribute(html, /<meta\s+name="robots"\s+content="([^"]+)"/i);
  const expected = indexable && stablePaths.includes(route)
    ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  assert.equal(robots, expected, 'Incorrect robots meta on ' + route);
  for (const property of ['og:title', 'og:description', 'og:site_name', 'og:locale', 'og:type']) {
    assert.ok(html.includes('property="' + property + '"'), 'Missing ' + property + ': ' + route);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description']) {
    assert.ok(html.includes('name="' + name + '"'), 'Missing ' + name + ': ' + route);
  }
  assert.equal((html.match(/<meta\s+name="description"/g) || []).length, 1, 'Duplicate descriptions on ' + route);
  assert.equal((html.match(/<meta\s+name="robots"/g) || []).length, 1, 'Duplicate robots on ' + route);
  const canonical = matchAttribute(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (route.includes('/chi-tiet/')) {
    assert.equal(canonical, null, 'Query-only detail cannot self-canonicalize: ' + route);
  } else {
    const expectedCanonical = route === '/lich-chieu/momo/' ? pathToUrl('/lich-chieu/') : pathToUrl(route);
    assert.equal(canonical, expectedCanonical, 'Incorrect canonical: ' + route);
  }
  if (stablePaths.includes(route)) {
    const ld = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    assert.ok(ld, 'Missing static JSON-LD on ' + route);
    const parsed = JSON.parse(ld[1]);
    const nodes = parsed['@graph'];
    assert.ok(nodes.some((item) => item['@type'] === 'WebPage'), 'Missing WebPage on ' + route);
    assert.equal(nodes.some((item) => item['@type'] === 'WebSite'), route === '/', 'WebSite schema only on homepage');
    assert.equal(nodes.some((item) => item['@type'] === 'BreadcrumbList'), route !== '/', 'Breadcrumb mismatch on ' + route);
    assert.ok(nodes.every((item) => JSON.stringify(item).includes('https://schema.org') === false), 'Unexpected nested schemas');
  }
  console.log('SEO PASS:', route, '(' + robots + ')');
}

const sitemap = readFileSync('dist/sitemap.xml', 'utf8');
const robotText = readFileSync('dist/robots.txt', 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(locs, indexable ? stablePaths.map(pathToUrl) : [], 'Sitemap must only contain eligible production URLs');
assert.ok(!sitemap.includes('/previews/') && !sitemap.includes('chi-tiet'), 'Sitemap has preview or query templates');
assert.ok(robotText.includes('User-agent: *') && robotText.includes('Allow: /'), 'robots.txt unavailable');
assert.equal(robotText.includes('Sitemap: ' + origin + '/sitemap.xml'), indexable, 'Sitemap declaration launch gate mismatch');
console.log('SEO PASS: canonical, metadata, JSON-LD, sitemap, robots and preview safety');
