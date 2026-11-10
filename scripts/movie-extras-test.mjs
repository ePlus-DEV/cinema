#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { youtubeVideoId, feedTrailerId, movieMedia, youtubeSearch } from '../src/lib/movie-media.js';

assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=OGO4Mqvo3jI'), 'OGO4Mqvo3jI');
assert.equal(youtubeVideoId('https://youtu.be/uaebGAUr8rM?t=15'), 'uaebGAUr8rM');
assert.equal(youtubeVideoId('https://www.youtube-nocookie.com/embed/c4zgZ2s5N_Y'), 'c4zgZ2s5N_Y');
assert.equal(youtubeVideoId('https://www.youtube.com/shorts/c4zgZ2s5N_Y'), 'c4zgZ2s5N_Y');
assert.equal(youtubeVideoId('https://evil.example/watch?v=OGO4Mqvo3jI'), null, 'Unknown video host must not embed');
assert.equal(youtubeVideoId('javascript:alert(1)'), null);
assert.equal(youtubeVideoId('http://youtube.com/watch?v=OGO4Mqvo3jI'), null);
assert.equal(youtubeVideoId('https://www.youtube.com.evil.example/watch?v=OGO4Mqvo3jI'), null);
assert.equal(youtubeVideoId('https://youtube.com/watch?v=bad'), null);
assert.equal(feedTrailerId({ TrailerUrl: 'https://youtu.be/OGO4Mqvo3jI' }), 'OGO4Mqvo3jI');

assert.equal(movieMedia({ title: 'Clayface' }).videoId, 'OGO4Mqvo3jI');
assert.equal(movieMedia({ title: 'Ngày Con Còn Mẹ' }).videoId, 'c4zgZ2s5N_Y');
assert.equal(movieMedia({ title: 'Bò Sữa Bay' }).videoId, 'uaebGAUr8rM');
assert.equal(movieMedia({ title: 'Bò Sữa Bay' }).reviews.length, 2);
assert.equal(movieMedia({ title: 'Phim chưa có trailer' }).videoId, null, 'No invented trailer IDs');
assert.equal(movieMedia({ title: 'Clayface', trailerUrl: 'https://www.youtube.com/watch?v=uaebGAUr8rM' }).videoId,
  'uaebGAUr8rM', 'Validated upstream trailer takes priority over curated fallback');
assert.ok(youtubeSearch('Bò Sữa Bay').startsWith('https://www.youtube.com/results?search_query='));

const component = readFileSync('src/components/MovieExtras.astro', 'utf8');
const staticPage = readFileSync('src/pages/phim/[slug].astro', 'utf8');
const fallbackPage = readFileSync('src/pages/phim/chi-tiet.astro', 'utf8');
const catalog = readFileSync('src/lib/cinema-catalog.ts', 'utf8');
const sync = readFileSync('scripts/sync-cinema-catalog.mjs', 'utf8');
assert.ok(staticPage.includes('<MovieExtras movie={movie} />'), 'Pre-rendered film details must have extras');
assert.ok(fallbackPage.includes('<MovieExtras />'), 'Legacy query details must have extras');
assert.ok(fallbackPage.includes("new CustomEvent('cinema:film-loaded'"), 'Fallback page must update extras on film load');
assert.ok(catalog.includes('trailerUrl: strings(row.trailerUrl)'), 'Catalog must pass trailer metadata');
assert.ok(sync.includes('trailerUrl:String(f.TrailerUrl'), 'Daily sync must capture optional trailer metadata');
assert.ok(sync.includes('autoplayTrailer:String(f.ApiAutoplayTrailer'), 'Daily sync must capture the MoMo trailer clip');
assert.ok(sync.includes('momoReviews:(Array.isArray(f.TopComments)'), 'Daily sync must capture MoMo audience reviews');
assert.ok(sync.includes('ratingPoint:typeof f.ApiRatingPoint'), 'Daily sync must capture the MoMo audience score');
assert.ok(catalog.includes('momoReviews: momoReviewsOf(row)'), 'Catalog must pass MoMo audience reviews');
assert.ok(component.includes('data-momo-reviews'), 'Film details must render MoMo audience reviews');
assert.ok(component.includes('data-trailer-clip'), 'MoMo trailer clip must be playable on-site');
assert.ok(component.includes('momocdn'), 'MoMo clip URLs must be restricted to the MoMo CDN');
const grid = readFileSync('src/components/LiveMovieGrid.astro', 'utf8');
const trailerModal = readFileSync('src/components/TrailerModal.astro', 'utf8');
assert.ok(grid.includes('data-play-trailer'), 'Movie posters must offer trailer playback');
assert.ok(grid.includes('poster-trailer-btn'), 'Movie posters must show a trailer button');
assert.ok(trailerModal.includes("addEventListener('click'"), 'Poster trailer clicks must be intercepted');
assert.ok(trailerModal.includes('momocdn'), 'Poster trailer clips must be restricted to the MoMo CDN');
assert.ok(component.includes('https://www.youtube-nocookie.com/embed/'), 'Privacy-enhanced trailer player required');
assert.ok(component.includes("player.addEventListener('click'"), 'Video should only load after explicit click');
assert.ok(component.includes('window.localStorage.setItem(storageKey()'), 'Personal reviews must save locally');
assert.ok(component.includes('window.localStorage.removeItem(storageKey()'), 'Personal reviews must be deletable');
assert.ok(component.includes('Riêng tư trên trình duyệt này'), 'Review scope must be clearly labeled');
assert.ok(component.includes('data-review-spoiler'), 'Users can flag spoilers');
assert.ok(!component.includes('aggregateRating') && !component.includes('AggregateRating'),
  'Never create a fake public rating schema');
console.log('PASS: film-specific verified trailers, editorial links, local-only review and safe fallback');
