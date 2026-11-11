#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const baseSegment = (process.env.PAGES_BASE_PATH || '/').split('/').filter(Boolean).join('/');
const base = baseSegment ? '/' + baseSegment + '/' : '/';

const routes = [
  '/',
  '/phim-dang-chieu/',
  '/phim-sap-chieu/',
  '/lich-chieu/',
  '/lich-chieu/momo/',
  '/danh-gia/',
  '/phim/chi-tiet/',
  '/rap/chi-tiet/',
  '/rap/',
  // Real movie and theater paths are checked from their generated IDs below.
];

for (const route of routes) {
  const path = join('dist', route.replace(/^\/+/, ''), 'index.html');
  assert.ok(existsSync(path), 'Missing static page: ' + route);
  const html = readFileSync(path, 'utf8');
  assert.match(html, /<html\s+lang="vi">/, 'Missing Vietnamese language declaration: ' + route);
  assert.match(html, /noindex,\s*nofollow/, 'Demo page must stay noindex: ' + route);
  assert.ok(html.includes('<title>'), 'Missing title: ' + route);
  if (route === '/' || route === '/danh-gia/') {
    assert.ok(!html.includes('data-page-skeleton'), 'Homepage/reviews must not be blocked by the full-page overlay: ' + route);
  } else {
    assert.ok(html.includes('data-page-skeleton'), 'Missing full-page skeleton: ' + route);
  }
  assert.ok(html.includes('page-skeleton-done'), 'Missing skeleton timeout safeguard: ' + route);
  console.log('PASS: ' + route);
}
const home = readFileSync('dist/index.html', 'utf8');
assert.ok(home.includes('href="' + base + 'phim-dang-chieu'), 'Movie navigation not Pages-base-aware');
assert.ok(home.includes('data-movie-rail'), 'Film discovery rails missing on homepage');
assert.ok(home.includes('data-home-hero'), 'Homepage spotlight hero missing');
assert.ok(home.includes('data-hero-banner'), 'Hero background must be separate from the small thumb image');
assert.ok(home.includes('data-banner-fallback='), 'Large hero banner must retain a provider fallback');
const heroBackgrounds = [...home.matchAll(/<img[^>]*class="home-hero__bg"[^>]*>/g)].map(match => match[0]);
assert.ok(heroBackgrounds.length > 0, 'Expected SSR hero banners');
assert.ok(heroBackgrounds.every(tag => !/src="[^"]*\?size=M"/.test(tag)), 'Full-screen hero must not use the medium thumbnail variant');

assert.ok(home.includes('href="' + base + 'favicon.svg'), 'Favicon not Pages-base-aware');
assert.ok(home.includes('href="' + base + '_astro/') || home.includes('src="' + base + '_astro/'), 'Astro assets not Pages-base-aware');
assert.ok(existsSync('dist/_astro'), 'Astro assets directory missing');
console.log('PASS: base ' + base + ' and assets; static-site smoke tests completed');

const movieDetail = readFileSync('dist/phim/chi-tiet/index.html', 'utf8');
const cinemaDetail = readFileSync('dist/rap/chi-tiet/index.html', 'utf8');
assert.ok(movieDetail.includes('data-film-content'), 'Movie detail shell missing');
assert.ok(cinemaDetail.includes('data-cinema-content'), 'Cinema detail shell missing');
assert.ok(home.includes('section--dark'), 'Now-showing rail must sit on the dark section');
assert.ok(!home.includes('class="hero"'), 'Legacy fixture hero must stay removed');
console.log('PASS: real detail routes and movie-first homepage');

const filmPage = readFileSync('dist/phim/chi-tiet/index.html', 'utf8');
const cinemaPage = readFileSync('dist/rap/chi-tiet/index.html', 'utf8');
for (const [route, html] of [['phim/chi-tiet', filmPage], ['rap/chi-tiet', cinemaPage]]) {
  assert.ok(html.includes('data-page-priority'), 'Detail has no initial loading signal: ' + route);
  assert.ok(html.includes('detail-skeleton'), 'Detail placeholders missing: ' + route);
  assert.ok(html.includes('detail-schedule-skeleton'), 'Schedule placeholder missing: ' + route);
}
assert.ok(home.includes('live-poster__badge'), 'Pre-rendered movie cards missing');
assert.ok(home.includes('momo-live__loading-program'), 'Live showtime card skeletons missing');
assert.ok(!home.includes('class="page-skeleton"'), 'Homepage contains a blocking loading overlay despite SSR movie data');
const preRenderedMovieCards = (home.match(/movie-rail__card/g) || []).length;
assert.ok(preRenderedMovieCards >= 8, 'Homepage must include server-rendered movie cards independent of API');
console.log('PASS: homepage SSR first paint, full-page fallback on dynamic routes and local schedule loading');


const reviewPage = readFileSync('dist/danh-gia/index.html', 'utf8');
assert.ok(reviewPage.includes('data-review-hub') && reviewPage.includes('data-hub-list'), 'Review hub must exist');
assert.ok(reviewPage.includes('data-hub-skeleton'), 'Reviews must prerender card skeletons for the live API');
assert.ok((reviewPage.match(/review-hub__skeleton-film/g) || []).length >= 3, 'At least three review card placeholders must be visible before data loads');
assert.ok(reviewPage.includes('data-hub-status') && reviewPage.includes('data-hub-more'), 'Review status and pagination must remain functional');
assert.ok(!reviewPage.includes('data-page-skeleton'), 'Review card skeletons must not be covered by full-page overlay');
const reviewSrc = readFileSync('src/components/ReviewHub.astro', 'utf8');
assert.match(reviewSrc, /showSkeleton\(\)/, 'Loading more reviews must show review skeleton cards');
assert.match(reviewSrc, /removeSkeleton\(\)/, 'Skeletons must be removed on API success or error');
assert.match(reviewSrc, /renderedCards > 0/, 'Empty review cards must show an appropriate fallback');
console.log('PASS: review card skeleton first paint and load-more states');

const explorer = readFileSync('dist/lich-chieu/index.html', 'utf8');
assert.ok(explorer.includes('schedule-page--explorer'), 'Standalone schedule must use full-width explorer');
assert.ok(explorer.includes('data-momo-district'), 'Missing functional location/district selector');
assert.ok(explorer.includes('data-momo-chips'), 'Missing cinema chain filters');
assert.ok(explorer.includes('data-momo-cinemas'), 'Missing cinema selector');
const homeDirectory = home.match(/data-momo-cinemas[^>]*aria-busy="false"/);
assert.ok(homeDirectory, 'Daily cinema snapshot must provide a ready SSR theater list on homepage');
assert.ok((home.match(/class="momo-live__cinema" data-cinema=/g) || []).length >= 10, 'Homepage must pre-render theater names before API calls');
assert.ok(home.includes('data-directory-seeds='), 'Listing must embed per-city cached directory data for client hydration');
assert.ok(home.includes('momo-live__loading-program'), 'Live session loading must remain visible separately');
const scheduleSrc = readFileSync('src/components/MomoShowtimeList.astro', 'utf8');
assert.match(scheduleSrc, /getCachedSession\(/, 'Cached showtime read must work without a live response');
assert.match(scheduleSrc, /storeSession\(/, 'Fresh showtime results must refresh browser cache');
assert.match(scheduleSrc, /momo-live__cached-note/, 'Unverified cached times must be visibly labeled');

assert.ok(explorer.includes('data-directory-seeds='), 'Standalone schedule must reuse the daily city directory seed');
const cinemaExplorerSource = readFileSync('src/components/MomoShowtimeList.astro', 'utf8');
assert.match(cinemaExplorerSource, /function skeletonDirectory\(cityId\)/, 'Selecting an uncached city must render directory skeletons');
assert.match(cinemaExplorerSource, /momo-live__cinema-placeholder skeleton/, 'Directory loading must show cinema-row skeletons');
assert.match(cinemaExplorerSource, /momo-live__chip-placeholder skeleton/, 'Directory loading must show chain-filter skeletons');
assert.match(cinemaExplorerSource, /skeletonDirectory\(cityId\);/, 'Uncached city initialization must invoke skeletonDirectory');
assert.match(cinemaExplorerSource, /districtEl\.disabled = false/, 'District selection must be restored after directory loading');

assert.ok(existsSync('src/styles/cinema-compact.css'), 'Compact cinema explorer stylesheet missing');
const compactScheduleCss = readFileSync('src/styles/cinema-compact.css', 'utf8');
assert.ok(compactScheduleCss.includes('#lich-chieu .schedule-shell__top { display: none; }'), 'Homepage schedule must remove redundant title row');
assert.match(compactScheduleCss, /#lich-chieu \.schedule-shell\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*margin-inline:\s*0;/s, 'Homepage schedule shell must align with the full-width section container');
assert.ok(compactScheduleCss.includes('.momo-live__chip-name'), 'Compact chain labels must fit one line');
assert.ok(compactScheduleCss.includes('.momo-live__viewer-head { display: none; }'), 'Compact schedule must avoid repeating selected cinema header');
assert.ok(compactScheduleCss.includes('@media (max-width: 760px)'), 'Compact schedule must support small screens');

assert.ok(explorer.includes('data-momo-selected-cinema'), 'Missing selected venue title');
assert.equal((explorer.match(/<div[^>]*\bdata-date-picker(?=\s|>)/g) || []).length, 1, 'Exactly one date picker DOM element should appear in explorer');
assert.ok(explorer.includes('seatmap__eyebrow'), 'Seat map should explain the preview-only flow');
assert.ok(existsSync('src/lib/cinema-logos.js'), 'Theater logos helper is missing');
const logos = readFileSync('src/lib/cinema-logos.js', 'utf8');
assert.ok(logos.includes('CHAIN_LOGOS'), 'Logo mapping missing');
assert.ok(logos.includes('createChainLogo'), 'Logo fallback helper missing');
console.log('PASS: location selector, theater logos, internal date rail and seat-map preview');

const mainStart = home.indexOf('<main id="main-content"');
const mainEnd = home.indexOf('</main>', mainStart);
const featured = home.indexOf('data-home-hero', mainStart);
const footer = home.indexOf('<footer class="footer"');
console.log('DOM order diagnostics:', JSON.stringify({mainStart,mainEnd,featured,footer,mainTag:home.slice(mainStart,mainStart+260),featuredTag:home.slice(featured,featured+170)}));
assert.ok(mainStart >= 0 && mainStart < featured && featured < mainEnd && mainEnd < footer,
  'Home content must be INSIDE <main> and BEFORE the footer, not appended after </html>');
assert.ok(home.indexOf('</html>') > footer, 'HTML document closes before footer');
assert.ok(!home.includes('Đây là bản xem trước giao diện.'), 'Preview-only warning leaked to production');
assert.ok(home.includes('data-rail-track') && home.includes('movie-rail__card'), 'Movie cards should be prerendered, not API-blocked');

const filmIds = readdirSync('dist/phim').filter(name => /^[1-9][0-9]*$/.test(name));
const theaterIds = readdirSync('dist/rap').filter(name => /^[1-9][0-9]*-[a-zA-Z0-9_-]+$/.test(name));
assert.ok(filmIds.length > 0, 'No real static film detail routes were generated');
assert.ok(theaterIds.length > 0, 'No real static cinema detail routes were generated');
for (const [directory,id] of [['phim',filmIds[0]], ['rap',theaterIds[0]]]) {
  const detail = readFileSync('dist/' + directory + '/' + id + '/index.html', 'utf8');
  assert.match(detail, /<h1[^>]*>[^<]+<\/h1>/, 'Missing SSR detail title: '+directory);
  assert.ok(detail.includes('data-page-priority') && detail.includes('aria-busy="false"'),
    'SSR details cannot be blocked on the live API');
  assert.ok(detail.includes('data-momo-live') || directory === 'phim',
    'Live schedule module missing from cinema detail');
  const main = detail.indexOf('<main id="main-content"');
  const close = detail.indexOf('</main>', main);
  const footer = detail.indexOf('<footer class="footer"');
  assert.ok(main >= 0 && close > main && footer > close, 'Incorrect detail DOM layout');
}
console.log('PASS: real prerendered routes and document ordering (' + filmIds.length + ' films, ' + theaterIds.length + ' cinemas)');

const dateSrc = readFileSync('src/components/DatePicker.astro','utf8');
assert.match(dateSrc, /length: 9/, 'Nine independent visible dates must be created');
assert.match(dateSrc, /data-date-next/, 'Date picker must have forward navigation');
assert.match(dateSrc, /data-date-prev/, 'Date picker must have backwards navigation');
assert.match(dateSrc, /start \+= pageStep\(\)/, 'No fixed provider-imposed date range');
assert.match(dateSrc, /cinema:day/, 'Selected offset must reach live session loader');
assert.ok((home.match(/data-day-offset="/g)||[]).length >= 9, 'Homepage must prerender at least nine days');
assert.ok(explorer.includes('data-date-next'), 'Dedicated schedule must allow future dates');


// Grouped cinema directory must remain fully prerendered for SEO and fast UI.
const cinemaListPage = readFileSync('dist/rap/index.html', 'utf8');
assert.ok(cinemaListPage.includes('data-grouped="true"'), 'Cinema catalog must group theaters by chain');
assert.ok(cinemaListPage.includes('data-chain-filter="all"'), 'Cinema group filter must include all theaters');
assert.ok((cinemaListPage.match(/data-chain-group="/g) || []).length >= 3, 'Cinema directory must prerender multiple chain groups');
assert.ok((cinemaListPage.match(/data-group-index="/g) || []).length >= 20, 'Cinema directory must retain venue links even when sections collapse');
assert.ok(cinemaListPage.includes('data-chain-toggle'), 'Large cinema groups need a show-all control');
const cinemaGroupsSrc = readFileSync('src/components/LiveCinemaGrid.astro','utf8');
assert.match(cinemaGroupsSrc, /search\?\.addEventListener\('input', render\)/, 'Grouped cinema search must remain interactive');
assert.match(cinemaGroupsSrc, /selectedChain = button\.dataset\.chainFilter/, 'Cinema filters must select chain groups');
assert.match(cinemaGroupsSrc, /section\.dataset\.expanded/, 'Cinema groups must expand and collapse');

const siteHeaderSrc = readFileSync('src/components/SiteHeader.astro','utf8');
const citySyncSrc = readFileSync('src/components/MomoShowtimeList.astro','utf8');
assert.match(siteHeaderSrc, /data-city-trigger/, 'Header needs interactive city picker');
assert.match(siteHeaderSrc, /data-city-search/, 'Province selector needs search');
assert.match(siteHeaderSrc, /cinema:city-change/, 'Header selection must broadcast city change');
assert.match(siteHeaderSrc, /setCityId\(city\.id\)/, 'Shared city preference must persist');
assert.match(citySyncSrc, /window\.addEventListener\('cinema:city-change'/, 'Schedule must respond to global city selection');
assert.match(citySyncSrc, /params\.get\('city'\)/, 'Direct links from non-HCM theater directory must support city query');

const cityGroupedPage = readFileSync('dist/rap/index.html','utf8');
assert.ok(cityGroupedPage.includes('data-city-directories='), 'Group directory must embed daily per-city seeds');
assert.ok(cityGroupedPage.includes('data-rap-city-copy'), 'Province selection must update the theater page description');
const cityGroupedSrc = readFileSync('src/components/LiveCinemaGrid.astro','utf8');
assert.match(cityGroupedSrc, /cinema:city-change/, 'Cinema catalog must react to header selection');
assert.match(cityGroupedSrc, /loadAllCinemas\(\)/, 'Unsnapshotted provinces must have live fallback');
assert.match(cityGroupedSrc, /requestToken/, 'Stale provider responses must not replace another city');
assert.match(cityGroupedSrc, /CITY_CACHE_PREFIX/, 'Previously visited provinces should render without another network call');

const groupedLogoCss = readFileSync('src/components/LiveCinemaGrid.astro','utf8');
const showtimeLogoCss = readFileSync('src/styles/cinema-compact.css','utf8');
assert.match(groupedLogoCss, /flex:\s*0 0 44px/, 'Grouped cinema brand slots must use a uniform 44px canvas');
assert.match(groupedLogoCss, /width:\s*34px;[\s\S]*?height:\s*34px;/, 'Grouped cinema artwork must fit identical inner boxes');
assert.match(groupedLogoCss, /object-fit:\s*contain/, 'Do not crop provider logos to make them appear uniform');
assert.match(groupedLogoCss, /object-position:\s*center;[\s\S]*?padding:\s*0;/, 'No double padding that shrinks brand marks');
assert.match(showtimeLogoCss, /Consistent cinema-chain logo artwork/, 'Compact showtimes must use unified logo artwork too');

const mobileMenuSrc = readFileSync('src/components/SiteHeader.astro','utf8');
assert.match(mobileMenuSrc, /href=\{route\(link\.href\)\}/, 'Mobile navigation must retain the deployment base path');
assert.match(mobileMenuSrc, /href=\{route\('\/'\)\}/, 'Logo must retain the preview base path');
assert.match(mobileMenuSrc, /data-nav-city/, 'Mobile navigation needs an accessible province selector');
assert.match(mobileMenuSrc, /cinema:city-picker-open/, 'Opening province selection must close the mobile drawer');
assert.match(mobileMenuSrc, /cinema:nav-open/, 'Opening the navigation drawer must close the province picker');
assert.match(mobileMenuSrc, /matchMedia\('\(min-width: 861px\)'\)/, 'Mobile drawer must close on desktop resize');
assert.match(mobileMenuSrc, /max-height: calc\(100dvh - var\(--mobile-header-height\) - 20px\)/, 'Province picker must fit mobile viewport');

const mobileHeaderCss = readFileSync('src/styles/global.css', 'utf8');
assert.match(mobileHeaderCss, /\.header-action span:last-child \{ font-size: 18px; \}/, 'Large header icon font must apply only to the arrow');
assert.ok(!mobileHeaderCss.includes('.header-action span { font-size: 18px; }'), 'Mobile schedule CTA label must not inherit oversized 18px font');
assert.match(mobileHeaderCss, /\.site-header \.header-action \.header-action__label \{\s*font-size: 11px;/, 'Mobile schedule CTA label must remain compact');
