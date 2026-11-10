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
export const movies = uniqueBy((source.movies || []).map((row) => ({
  id: text(row.id),
  title: strings(row.title),
  titleEn: strings(row.titleEn),
  genre: strings(row.genre),
  duration: Number(row.duration) || 0,
  age: strings(row.age),
  synopsis: strings(row.synopsis),
  posterUrl: strings(row.posterUrl),
  trailerUrl: strings(row.trailerUrl),
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
