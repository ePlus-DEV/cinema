import { editorialMedia } from '../data/movie-editorial.js';

// Parse only real YouTube video references. Never embed arbitrary URLs from
// an undocumented feed and never use a search result as if it were the trailer.
export function youtubeVideoId(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const s = raw.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  let url;
  try { url = new URL(s); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let id = '';
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
    else if (/^\/(?:embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2] || '';
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
}
const text = (v) => String(v || '').normalize('NFC').toLocaleLowerCase('vi').trim();
const trailerFields = ['trailerUrl', 'TrailerUrl', 'Trailer', 'TrailerLink',
  'YoutubeUrl', 'YouTubeUrl', 'YoutubeTrailerUrl', 'VideoUrl', 'Video', 'trailer'];
export function feedTrailerId(movie) {
  if (!movie || typeof movie !== 'object') return null;
  for (const field of trailerFields) {
    const id = youtubeVideoId(movie[field]);
    if (id) return id;
  }
  return null;
}
export function movieMedia(movie) {
  const matched = editorialMedia[text(movie.title)] || editorialMedia[text(movie.titleEn)];
  const id = feedTrailerId(movie) || youtubeVideoId(matched?.trailer);
  return {
    videoId: id,
    source: id && matched && youtubeVideoId(matched.trailer) === id
      ? matched.trailerSource || 'Kênh phát hành' : (id ? 'Nguồn trailer phim' : ''),
    reviews: (matched?.reviews || []).filter(item => {
      try {
        const url = new URL(item.url);
        return url.protocol === 'https:' && !!item.publisher && !!item.title;
      } catch { return false; }
    })
  };
}
export function youtubeSearch(title, titleEn) {
  return 'https://www.youtube.com/results?search_query=' +
    encodeURIComponent((title || titleEn || '') + ' trailer chính thức');
}
