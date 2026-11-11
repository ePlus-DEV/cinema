// Browser-side MoMo Cinema API client.
//
// The MoMo API only sends CORS headers for Origin https://www.momo.vn, so the
// browser cannot call it directly from another domain. Requests therefore go
// through a CORS proxy (cors-anywhere style): "<proxy>/<full target URL>".
// The proxy base URL is configured with the PUBLIC_MOMO_CORS_PROXY env
// variable (see .env.example); the value below is the default fallback.
//
// Requests are signed exactly like the MoMo web app: X-Client-Token is the
// base64 AES-256-CBC encryption of "method§HH:MM:SS§url§md5(body)", keyed by
// SHA-256 of a string shipped in MoMo's public JS bundle. This reproduces a
// public web client's behaviour; it is not a licensed partner API.

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const MOMO_API_BASE = 'https://aws.momo.vn/momovn-cinema/public';
export const CORS_PROXY_URL = (
  metaEnv.PUBLIC_MOMO_CORS_PROXY || 'https://cors-eplus-bba6d8ad0ca6.herokuapp.com'
).replace(/\/+$/, '');

import { CITIES, DEFAULT_CITY_ID } from './cities.js';

export const MOMO_CITY_ID = DEFAULT_CITY_ID; // Default city: Hồ Chí Minh

// The visitor's chosen city drives every live cinema/session request. It is
// persisted across pages; the daily catalog snapshot stays Hồ Chí Minh.
const CITY_STORAGE_KEY = 'eplus-cinema:city';
let currentCityId = MOMO_CITY_ID;
try {
  const saved = Number(window.localStorage.getItem(CITY_STORAGE_KEY));
  if (CITIES.some((city) => city.id === saved)) currentCityId = saved;
} catch { /* storage unavailable */ }

export function getCityId() { return currentCityId; }

export function setCityId(id) {
  const next = CITIES.some((city) => city.id === Number(id)) ? Number(id) : MOMO_CITY_ID;
  if (next === currentCityId) return;
  currentCityId = next;
  cinemasPromise = null;
  filmRequests.clear();
  try { window.localStorage.setItem(CITY_STORAGE_KEY, String(next)); } catch { /* ignore */ }
}

export const CHAINS = {
  6: 'CGV',
  8: 'Lotte Cinema',
  9: 'Galaxy Cinema',
  3: 'BHD Star',
  10: 'Beta Cinemas',
  5: 'Cinestar',
  4: 'Mega GS',
  16: 'Cinemax',
  7: 'DCINE',
  17: 'Starlight',
  18: 'Rio Cinemas',
  20: 'NCC',
  21: 'AEON BETA',
  22: 'Metiz',
  19: 'Touch Cinema'
};

const VERSION_TYPES = { 1: '3D', 2: '2D', 3: '4DX', 4: 'IMAX', 5: '2D', 6: '3D' };
const CAPTION_TYPES = { 1: 'Lồng tiếng', 2: 'Phụ đề', 3: 'Thuyết minh' };

export function formatLabel(version) {
  const parts = [];
  if (VERSION_TYPES[version.VersionType]) parts.push(VERSION_TYPES[version.VersionType]);
  else if (version.VersionName) parts.push(version.VersionName);
  if (CAPTION_TYPES[version.CaptionType]) parts.push(CAPTION_TYPES[version.CaptionType]);
  else if (version.CaptionName) parts.push(version.CaptionName);
  return parts.join(' · ') || '2D';
}

/* ------------------------------------------------------------------ */
/* MD5 (Web Crypto has no MD5, and the MoMo signature needs md5(body)) */
/* Compact implementation of RFC 1321.                                 */
/* ------------------------------------------------------------------ */

function md5cycle(x, k) {
  let [a, b, c, d] = x;
  const ff = (q, w, e, r, t, y, u) => {
    const v = (q + ((w & e) | (~w & r)) + t + u) | 0;
    const s = ((v << y) | (v >>> (32 - y))) | 0;
    return (s + w) | 0;
  };
  const gg = (q, w, e, r, t, y, u) => {
    const v = (q + ((w & r) | (e & ~r)) + t + u) | 0;
    const s = ((v << y) | (v >>> (32 - y))) | 0;
    return (s + w) | 0;
  };
  const hh = (q, w, e, r, t, y, u) => {
    const v = (q + (w ^ e ^ r) + t + u) | 0;
    const s = ((v << y) | (v >>> (32 - y))) | 0;
    return (s + w) | 0;
  };
  const ii = (q, w, e, r, t, y, u) => {
    const v = (q + (e ^ (w | ~r)) + t + u) | 0;
    const s = ((v << y) | (v >>> (32 - y))) | 0;
    return (s + w) | 0;
  };
  a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
  a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
  a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
  a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
  x[0] = (x[0] + a) | 0; x[1] = (x[1] + b) | 0; x[2] = (x[2] + c) | 0; x[3] = (x[3] + d) | 0;
}

export function md5(input) {
  const bytes = new TextEncoder().encode(input);
  const words = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8));
  }
  const bitLen = bytes.length * 8;
  words[bytes.length >> 2] = (words[bytes.length >> 2] || 0) | (0x80 << ((bytes.length % 4) * 8));
  const totalWords = (((bytes.length + 8) >> 6) + 1) * 16;
  for (let i = 0; i < totalWords; i++) if (words[i] === undefined) words[i] = 0;
  words[totalWords - 2] = bitLen & 0xffffffff;
  words[totalWords - 1] = Math.floor(bitLen / 0x100000000);
  const state = [1732584193, -271733879, -1732584194, 271733878];
  for (let i = 0; i < words.length; i += 16) md5cycle(state, words.slice(i, i + 16));
  const hex = (n) => {
    let out = '';
    for (let j = 0; j < 4; j++) out += ((n >> (j * 8)) & 0xff).toString(16).padStart(2, '0');
    return out;
  };
  return state.map(hex).join('');
}

/* ------------------------------------------------------------------ */
/* Signed request helpers                                              */
/* ------------------------------------------------------------------ */

const textEncoder = new TextEncoder();

async function clientToken(method, path, bodyString) {
  const timestamp = new Date().toTimeString().split(' ')[0];
  const bodyHash = bodyString ? md5(bodyString) : '';
  const plain = `${method}§${timestamp}§${path}§${bodyHash}`;
  const keyBytes = await crypto.subtle.digest('SHA-256', textEncoder.encode('Una34%^&xMpajd'));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt']);
  const iv = textEncoder.encode('da3iks0ndfm@#335');
  const cipher = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, textEncoder.encode(plain));
  let binary = '';
  const arr = new Uint8Array(cipher);
  for (let i = 0; i < arr.length; i += 0x8000) binary += String.fromCharCode(...arr.subarray(i, i + 0x8000));
  return { token: btoa(binary), timestamp };
}

async function momoFetch(method, path, bodyObject) {
  const bodyString = bodyObject ? JSON.stringify(bodyObject) : null;
  const { token, timestamp } = await clientToken(method, path, bodyString);
  const response = await fetch(`${CORS_PROXY_URL}/${MOMO_API_BASE}${path}`, {
    method: method.toUpperCase(),
    headers: {
      'X-Client-Device': '5',
      'X-Client-Id': '',
      'X-Client-Token': token,
      'X-Timestamp': timestamp,
      'X-Project': 'cinema',
      'Content-Type': 'application/json'
    },
    body: bodyString || undefined
  });
  if (!response.ok) throw new Error(`MoMo API HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.Result !== true) throw new Error(payload.MessageStatus || 'MoMo API returned an error');
  return payload.Data;
}

export const momoGet = (path) => momoFetch('get', path, null);
export const momoPost = (path, bodyObject) => momoFetch('post', path, bodyObject);

async function loadCinemasForChain(chainId) {
  const items = [];
  let lastIndex = 0;
  for (;;) {
    const path = `/cinema/ci-cinema/loadMore?t=${Date.now()}&lastIndex=${lastIndex}&count=20&sortType=5&sortDir=2&cineplex=${chainId}&apiCityId=${currentCityId}`;
    const data = await momoGet(path);
    const page = data.Items || [];
    items.push(...page);
    if (!page.length || items.length >= (data.TotalItems || 0)) break;
    lastIndex = page[page.length - 1].Id;
  }
  return items;
}

let cinemasPromise = null;

/**
 * All cinemas in the configured city, deduplicated by chain + ApiCinemaId and
 * sorted by name. Memoized so several components on one page share one load.
 * Resolves to [{ key, chainId, apiCinemaId, name, address }].
 */
export function loadAllCinemas() {
  if (!cinemasPromise) {
    cinemasPromise = (async () => {
      const perChain = await Promise.all(Object.keys(CHAINS).map(async (key) => {
        try { return await loadCinemasForChain(Number(key)); } catch { return []; }
      }));
      const seen = new Set();
      const cinemas = [];
      for (const items of perChain) {
        for (const item of items) {
          const chainId = Number(item.Cineplex || 0);
          const key = `${chainId}:${item.ApiCinemaId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          cinemas.push({
            key,
            chainId,
            apiCinemaId: String(item.ApiCinemaId),
            name: item.Name || '',
            address: item.Address || ''
          });
        }
      }
      cinemas.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      // A temporary proxy/provider outage can produce an empty snapshot.
      // Do not memoize that forever: the "Thử lại" action must re-fetch.
      if (!cinemas.length) cinemasPromise = null;
      return cinemas;
    })();
  }
  return cinemasPromise;
}

/**
 * Seat map for one showtime. `show` is a ShowTimes entry from the session
 * response. Resolves to the first Data element: { SeatsInfo: { Seats (rows of
 * seat cells), SeatTypes, TotalCol, TotalRow }, ... }. In a seat cell,
 * `id: null` is a gap (aisle/no seat), `status: 0` is available and any other
 * status is taken; `cinemaAreaCode` matches a SeatTypes.Type; `price` is VND.
 */
export async function loadSeats(show) {
  const data = await momoPost('/v2/cinema/seat', {
    apiCinemaId: show.ApiCinemaId,
    cineplex: show.Cineplex,
    sessionId: show.SessionId,
    screenNumber: show.ScreenNumber,
    screenName: show.ScreenName,
    showDateTime: show.ShowDateTime,
    RecaptchaToken: ''
  });
  const first = Array.isArray(data) ? data[0] : data;
  if (!first || !first.SeatsInfo) throw new Error('MoMo không trả về sơ đồ ghế');
  return first;
}

/** Date string (YYYY-MM-DD) in Asia/Ho_Chi_Minh, `offset` days from today. */
export function saigonDate(offset = 0) {
  const shifted = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(shifted);
}


/**
 * Current/upcoming movie listings for client-rendered directory and detail pages.
 * Memoize per status so multiple grids do not duplicate API calls on one page.
 * Failed requests are evicted so manual retry works.
 */
const filmRequests = new Map();
export function loadAllFilms(status = 'now') {
  const apiStatus = status === 'soon' ? 2 : 3;
  if (!filmRequests.has(apiStatus)) {
    const request = (async () => {
      let lastIndex = 0;
      const seen = new Set();
      const films = [];
      for (let page = 0; page < 8; page++) {
        const url = '/cinema/ci-film/loadMore?apiStatus=' + apiStatus +
          '&lastIndex=' + encodeURIComponent(lastIndex) +
          '&count=30&sortType=5&sortDir=1&apiCityId=' + currentCityId;
        const data = await momoGet(url);
        const items = data.Items || [];
        for (const film of items) {
          if (!film.Id || seen.has(String(film.Id))) continue;
          seen.add(String(film.Id));
          films.push(film);
        }
        if (!items.length || (data.TotalItems && films.length >= data.TotalItems)) break;
        const nextIndex = data.LastIndex || items[items.length - 1]?.Id;
        if (!nextIndex || String(nextIndex) === String(lastIndex)) break;
        lastIndex = nextIndex;
      }
      return films;
    })().catch((error) => {
      filmRequests.delete(apiStatus);
      throw error;
    });
    filmRequests.set(apiStatus, request);
  }
  return filmRequests.get(apiStatus);
}
