#!/usr/bin/env node
/**
 * fetch-momo-showtimes.mjs — Lấy danh sách lịch chiếu thật từ API công khai
 * mà trang MoMo Cinema (https://www.momo.vn/cinema/lich-chieu) dùng ở phía trình duyệt.
 *
 * Cách trang MoMo hoạt động (đã kiểm chứng 2026-11-10):
 *  - Base API: https://aws.momo.vn/momovn-cinema/public
 *  - Mọi request phải có header ký X-Client-Token:
 *      AES-256-CBC( `${method}§${HH:MM:SS}§${url}§${md5(body)||''}` )
 *      key = SHA-256("Una34%^&xMpajd"), iv = "da3iks0ndfm@#335", output base64.
 *    Kèm: X-Client-Device: 5, X-Timestamp: HH:MM:SS, X-Project: cinema.
 *  - Phim:        GET  /cinema/ci-film/loadMore?apiStatus=3 (đang chiếu) / 2 (sắp chiếu)
 *  - Rạp:         GET  /cinema/ci-cinema/loadMore?t=&count=&sortType=5&sortDir=2&cineplex=&apiCityId=
 *  - Lịch chiếu:  POST /v2/cinema/session  { Cineplex, ApiCinemaId, Date: "YYYY-MM-DD", RecaptchaToken: "" }
 *    -> Data.Films[].VersionsCaptions[].ShowTimes[]
 *
 * Lưu ý: đây là API không có tài liệu/chưa phải kênh đối tác chính thức.
 * Dữ liệu chỉ nên dùng để tham khảo/phát triển; giữ ghi nguồn MoMo và
 * không bật bán vé / bỏ noindex cho tới khi có nguồn dữ liệu được cấp phép
 * (đúng lộ trình "Next phase" trong README).
 *
 * Dùng:
 *   node scripts/fetch-momo-showtimes.mjs [--city=50] [--cineplex=6] [--days=3]
 *                                        [--date=2026-11-10] [--out=src/data/momo-showtimes.json]
 * Mặc định: TP. Hồ Chí Minh (apiCityId=50), tất cả chuỗi rạp, hôm nay + 2 ngày (giờ Asia/Ho_Chi_Minh).
 */
import { createCipheriv, createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = 'https://aws.momo.vn/momovn-cinema/public';
const SOURCE_URL = 'https://www.momo.vn/cinema/lich-chieu';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || 'true'];
  })
);
const cityId = Number(args.city || 50);
const cineplex = args.cineplex ? Number(args.cineplex) : null; // vd 6=CGV, 8=Lotte, 9=Galaxy, 3=BHD, 10=Beta, 5=Cinestar
const days = Math.min(Math.max(Number(args.days || 3), 1), 7);
const outPath = args.out || 'src/data/momo-showtimes.json';

function todayInSaigon() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}
const startDate = args.date || todayInSaigon();
const dateList = Array.from({ length: days }, (_, i) => {
  const d = new Date(`${startDate}T00:00:00+07:00`);
  d.setDate(d.getDate() + i);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
});

function signedHeaders(method, url, bodyStr) {
  const ts = new Date().toTimeString().split(' ')[0]; // HH:MM:SS local — server chấp nhận lệch múi giờ VN
  const md5 = bodyStr ? createHash('md5').update(bodyStr).digest('hex') : '';
  const plain = `${method}§${ts}§${url}§${md5}`;
  const key = createHash('sha256').update('Una34%^&xMpajd').digest();
  const cipher = createCipheriv('aes-256-cbc', key, Buffer.from('da3iks0ndfm@#335', 'utf8'));
  const token = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]).toString('base64');
  return {
    'X-Client-Device': '5',
    'X-Client-Id': '',
    'X-Client-Token': token,
    'X-Timestamp': ts,
    'X-Project': 'cinema',
    'Content-Type': 'application/json',
    Referer: SOURCE_URL,
    Origin: 'https://www.momo.vn',
    'User-Agent': 'Mozilla/5.0 (ePlus Cinema showtime fetcher)'
  };
}

async function api(method, path, body) {
  const bodyStr = body ? JSON.stringify(body) : undefined;
  const res = await fetch(BASE + path, { method: method.toUpperCase(), headers: signedHeaders(method, path, bodyStr), body: bodyStr });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.Result) throw new Error(`${method.toUpperCase()} ${path} -> HTTP ${res.status}: ${JSON.stringify(json)?.slice(0, 200)}`);
  return json.Data;
}

const slugify = (s) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadAll(kind, extra) {
  const items = [];
  let lastIndex = 0;
  for (;;) {
    const path =
      kind === 'film'
        ? `/cinema/ci-film/loadMore?apiStatus=${extra}&lastIndex=${lastIndex}&count=20&sortType=5&sortDir=1&apiCityId=${cityId}`
        : `/cinema/ci-cinema/loadMore?t=${Date.now()}&count=20&sortType=5&sortDir=2${cineplex ? `&cineplex=${cineplex}` : ''}&apiCityId=${cityId}${lastIndex ? `&lastIndex=${lastIndex}` : ''}`;
    const data = await api('get', path);
    items.push(...(data.Items || []));
    if (!data.LastIndex || data.LastIndex >= data.TotalItems || !(data.Items || []).length) break;
    lastIndex = data.LastIndex;
    await sleep(120);
  }
  return items;
}

console.log(`MoMo Cinema -> city=${cityId}${cineplex ? ` cineplex=${cineplex}` : ' (tất cả rạp)'} dates=${dateList.join(', ')}`);

const [filmsNowRaw, filmsSoonRaw, cinemasRaw] = await Promise.all([
  loadAll('film', 3),
  loadAll('film', 2),
  loadAll('cinema')
]);
console.log(`Phim đang chiếu: ${filmsNowRaw.length} · sắp chiếu: ${filmsSoonRaw.length} · rạp: ${cinemasRaw.length}`);

const movieById = new Map();
const addMovie = (f, status) => {
  if (!f?.Id || movieById.has(f.Id)) return;
  movieById.set(f.Id, {
    id: f.Id,
    apiFilmId: f.ApiFilmId || null,
    slug: slugify(f.Title) + '-' + f.Id,
    title: f.Title,
    titleEn: f.TitleEn || null,
    genre: f.ApiGenreName || '',
    duration: f.Duration || 0,
    age: f.ApiRatingFormat || f.ApiRating || '',
    rating: f.ApiRatingPoint ?? null,
    posterUrl: f.GraphicUrl || null,
    bannerUrl: f.BannerUrl || null,
    synopsis: f.Synopsis || '',
    openingDate: (f.OpeningDate || '').slice(0, 10) || null,
    status,
    momoLink: f.Link ? `https://www.momo.vn${f.Link}` : null
  });
};
filmsNowRaw.forEach((f) => addMovie(f, 'now'));
filmsSoonRaw.forEach((f) => addMovie(f, 'soon'));

// MoMo thỉnh thoảng trả 2 bản ghi cho cùng một rạp (khác Id, trùng ApiCinemaId) — khử trùng theo chuỗi + ApiCinemaId.
const cinemasRawUnique = [...new Map(cinemasRaw.map((c) => [`${c.Cineplex}:${c.ApiCinemaId}`, c])).values()];
const CHAINS = { 3: 'BHD Star', 4: 'Mega GS', 5: 'Cinestar', 6: 'CGV', 7: 'DCINE', 8: 'Lotte Cinema', 9: 'Galaxy Cinema', 10: 'Beta Cinemas', 16: 'Cinemax', 17: 'Starlight', 18: 'Rio', 19: 'Touch Cinema', 20: 'Trung Tâm Chiếu Phim Quốc Gia (NCC)', 21: 'AEON BETA', 22: 'Metiz Cinema' };
const cinemas = cinemasRawUnique.map((c) => ({
  id: c.Id,
  apiCinemaId: c.ApiCinemaId,
  slug: slugify(c.Name) + '-' + c.Id,
  name: c.Name,
  chainId: c.Cineplex,
  chain: CHAINS[c.Cineplex] || `Chuỗi ${c.Cineplex}`,
  address: c.Address || '',
  city: c.CityName || '',
  cityId: c.ApiCityId,
  lat: c.Lat ?? null,
  lon: c.Lon ?? null,
  momoLink: c.Link ? `https://www.momo.vn${c.Link}` : null
}));
const cinemaByApiId = new Map(cinemas.map((c) => [`${c.chainId}:${c.apiCinemaId}`, c]));

const VERSION = { 1: '3D', 2: '2D', 3: '4D', 4: 'IMAX' };
const CAPTION = { 1: 'Lồng tiếng', 2: 'Phụ đề', 3: 'Thuyết minh' };
const showtimes = [];
let sessionCalls = 0;
for (const cinema of cinemas) {
  for (const date of dateList) {
    let data;
    try {
      data = await api('post', '/v2/cinema/session', { Cineplex: cinema.chainId, ApiCinemaId: cinema.apiCinemaId, Date: date, RecaptchaToken: '' });
    } catch (e) {
      console.warn(`  ! ${cinema.name} ${date}: ${e.message}`);
      continue;
    }
    sessionCalls++;
    for (const film of data.Films || []) {
      addMovie(film, 'now');
      const movie = movieById.get(film.Id);
      for (const vc of film.VersionsCaptions || []) {
        const times = (vc.ShowTimes || []).map((s) => (s.ShowTime || '').slice(11, 16)).filter(Boolean).sort();
        if (!times.length) continue;
        showtimes.push({
          date,
          dayOffset: dateList.indexOf(date),
          movieSlug: movie.slug,
          cinemaSlug: cinema.slug,
          format: `${VERSION[vc.VersionType] || vc.VersionType} · ${CAPTION[vc.CaptionType] || ''}`.trim(),
          times,
          sessions: (vc.ShowTimes || []).map((s) => ({
            sessionId: s.SessionId, start: s.ShowTime, duration: s.ShowTimeDuration || '', screen: s.ScreenName || ''
          }))
        });
      }
    }
    await sleep(120);
  }
  console.log(`  ${cinema.name}: xong`);
}

const output = {
  source: 'MoMo Cinema (public web API used by momo.vn/cinema/lich-chieu)',
  sourceUrl: SOURCE_URL,
  fetchedAt: new Date().toISOString(),
  cityId,
  dates: dateList,
  movies: [...movieById.values()],
  cinemas,
  showtimes
};
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
const totalSessions = showtimes.reduce((n, s) => n + s.times.length, 0);
console.log(`\nĐã ghi ${outPath}: ${output.movies.length} phim, ${cinemas.length} rạp, ${showtimes.length} nhóm suất, ${totalSessions} suất chiếu (${sessionCalls} lần gọi session).`);
