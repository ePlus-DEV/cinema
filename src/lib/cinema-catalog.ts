import snapshot from '../data/cinema-snapshot.json';
import legacy from '../data/momo-showtimes.json';
import { cinemaPath, moviePath } from './cinema-routes.js';

// Existing verified snapshot seeds the site until the first daily refresh.
// The daily workflow only needs films + theaters; live session/seat API calls
// stay in the browser. Never use the old snapshot for showtime availability.
const source = snapshot.movies?.length && snapshot.cinemas?.length ? snapshot : legacy;
const strings = (v: unknown) => typeof v === 'string' ? v : '';
const text = (v: unknown) => String(v ?? '').trim();
const uniqueBy = <T>(rows: T[], key: (row: T) => string) => [...new Map(rows.map(row => [key(row), row])).values()];

export const fetchedAt = source.fetchedAt || null;

// MoMo audience data lives only in the daily snapshot (the legacy seed has
// none), so read it through a loose record instead of the shared row type.
const momoReviewsOf = (row: unknown) => {
  const list = (row as { momoReviews?: unknown } | null)?.momoReviews;
  if (!Array.isArray(list)) return [];
  return list.map((entry) => {
    const item = (entry ?? {}) as Record<string, unknown>;
    return {
      name: strings(item.name) || 'Khán giả',
      avatar: strings(item.avatar),
      point: typeof item.point === 'number' ? item.point : null,
      desc: strings(item.desc),
      tags: (Array.isArray(item.tags) ? item.tags : []).map((tag) => strings(tag)).filter(Boolean),
      images: (Array.isArray(item.images) ? item.images : []).map((url) => strings(url)).filter((url) => url.startsWith('https://')),
      createdTime: strings(item.createdTime)
    };
  }).filter((review) => review.desc || review.point !== null);
};
const loose = (row: unknown) => (row ?? {}) as Record<string, unknown>;

export const movies = uniqueBy((source.movies || []).map((row) => ({
  id: text(row.id),
  title: strings(row.title),
  titleEn: strings(row.titleEn),
  genre: strings(row.genre),
  duration: Number(row.duration) || 0,
  age: strings(row.age),
  synopsis: strings(row.synopsis),
  posterUrl: strings(row.posterUrl),
  bannerUrl: strings(loose(row).bannerUrl),
  trailerUrl: strings(row.trailerUrl),
  autoplayTrailer: strings(loose(row).autoplayTrailer),
  ratingPoint: typeof loose(row).ratingPoint === 'number' ? (loose(row).ratingPoint as number) : null,
  ratingTotal: Number(loose(row).ratingTotal) || 0,
  momoReviews: momoReviewsOf(row),
  openingDate: strings(row.openingDate),
  status: row.status === 'soon' ? 'soon' : 'now'
})).filter(movie => movie.title && moviePath(movie.id)), row => row.id);

export const cinemas = uniqueBy((source.cinemas || []).map(row => ({
  id: text(row.id),
  chainId: Number(row.chainId),
  apiCinemaId: text(row.apiCinemaId),
  name: strings(row.name),
  chain: strings(row.chain),
  address: strings(row.address),
  city: strings(row.city)
})).filter(cinema => cinema.name && cinemaPath(cinema.chainId, cinema.apiCinemaId)), row => String(row.chainId) + ':' + row.apiCinemaId);

export const moviesNow = movies.filter(movie => movie.status === 'now');
export const moviesSoon = movies.filter(movie => movie.status === 'soon');
export const routeForMovie = (id: string | number, base = '/') => moviePath(id, base);
export const routeForCinema = (cinema: {chainId: number; apiCinemaId: string}, base = '/') =>
  cinemaPath(cinema.chainId, cinema.apiCinemaId, base);
