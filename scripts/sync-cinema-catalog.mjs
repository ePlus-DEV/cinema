#!/usr/bin/env node
/**
 * Refresh only cinema/film catalogue data once per day via GitHub Actions.
 * No showtime, seat, session, availability or booking requests here: those
 * remain live client-side. The source is an undocumented public MoMo API, not
 * a licensed feed; noindex policy remains unchanged.
 *
 * node scripts/sync-cinema-catalog.mjs
 * node scripts/sync-cinema-catalog.mjs --check
 */
import { createCipheriv, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const out = new URL('../src/data/cinema-snapshot.json', import.meta.url);
const BASE = 'https://aws.momo.vn/momovn-cinema/public';
const CITY_ID = 50;
// Frequently selected cities get a ready-to-display cinema directory from the
// daily job. Other cities still use browser cache + on-demand discovery.
// Keep this list limited to avoid hitting the undocumented API excessively.
const EXTRA_CITY_IDS = [48, 1, 32, 47, 49]; // Đồng Nai, Hà Nội, Đà Nẵng, Bình Dương, Bà Rịa-Vũng Tàu
const CHAIN_NAMES = {
  3:'BHD Star',4:'Mega GS',5:'Cinestar',6:'CGV',7:'DCINE',8:'Lotte Cinema',
  9:'Galaxy Cinema',10:'Beta Cinemas',16:'Cinemax',17:'Starlight',
  18:'Rio Cinemas',19:'Touch Cinema',20:'NCC',21:'AEON BETA',22:'Metiz'
};
const validated = (data) => {
  if (data?.schemaVersion !== 1 || data.cityId !== CITY_ID ||
      !Array.isArray(data.movies) || !Array.isArray(data.cinemas)) {
    throw new Error('Unexpected cinema snapshot schema');
  }
  const filmIds = new Set(), cinemaKeys = new Set();
  for (const film of data.movies) {
    const id = String(film.id ?? '');
    if (!/^[1-9]\d*$/.test(id) || !film.title || filmIds.has(id)) {
      throw new Error('Invalid or duplicate movie: ' + id);
    }
    filmIds.add(id);
  }
  for (const cinema of data.cinemas) {
    const key = String(cinema.chainId) + ':' + cinema.apiCinemaId;
    if (!/^[1-9]\d*:[a-zA-Z0-9_-]+$/.test(key) || !cinema.name || cinemaKeys.has(key)) {
      throw new Error('Invalid or duplicate cinema: ' + key);
    }
    cinemaKeys.add(key);
  }
  if (data.cinemasByCity !== undefined) {
    if (!data.cinemasByCity || typeof data.cinemasByCity !== 'object' || Array.isArray(data.cinemasByCity)) {
      throw new Error('Invalid per-city cinema directory');
    }
    for (const [cityId, entry] of Object.entries(data.cinemasByCity)) {
      if (!/^\d+$/.test(cityId) || Number(cityId) === CITY_ID ||
          !entry || !Number.isFinite(Date.parse(entry.fetchedAt)) || !Array.isArray(entry.cinemas)) {
        throw new Error('Invalid city catalog: ' + cityId);
      }
      const keys = new Set();
      for (const cinema of entry.cinemas) {
        const key = String(cinema.chainId) + ':' + cinema.apiCinemaId;
        if (!/^[1-9]\d*:[a-zA-Z0-9_-]+$/.test(key) || !cinema.name || keys.has(key)) {
          throw new Error('Invalid or duplicated city cinema ' + cityId + ': ' + key);
        }
        keys.add(key);
      }
    }
  }
  return data;
};
if (process.argv.includes('--check')) {
  const data = validated(JSON.parse(readFileSync(out, 'utf8')));
  if (!data.movies.length || !data.cinemas.length) {
    // The first PR build uses the checked-in legacy snapshot until refresh.
    console.log('Cinema snapshot is not populated yet; legacy snapshot seeds the build.');
  } else console.log('Validated ' + data.movies.length + ' movies / ' + data.cinemas.length + ' cinemas.');
  process.exit(0);
}
const timestampVN = () => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Ho_Chi_Minh', hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
}).format(new Date());
const pause = (time) => new Promise((resolve) => setTimeout(resolve, time));
async function apiGet(path, { timeoutMs = 25000, attempts = 3 } = {}) {
  for(let attempt=0;attempt<attempts;attempt++) {
    try {
      const ts = timestampVN();
      const plain = 'get§' + ts + '§' + path + '§';
      const key = createHash('sha256').update('Una34%^&xMpajd').digest();
      const iv = Buffer.from('da3iks0ndfm@#335','utf8');
      const cipher = createCipheriv('aes-256-cbc',key,iv);
      const token = Buffer.concat([cipher.update(plain,'utf8'),cipher.final()]).toString('base64');
      const response = await fetch(BASE + path, {
        headers: {
          'X-Client-Device':'5','X-Client-Id':'','X-Client-Token':token,
          'X-Timestamp':ts,'X-Project':'cinema','Content-Type':'application/json',
          'Referer':'https://www.momo.vn/cinema/lich-chieu',
          'Origin':'https://www.momo.vn',
          'User-Agent':'Mozilla/5.0 (compatible; ePlusCinemaCatalog/1.0)'
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response.ok) throw new Error('HTTP '+response.status);
      const payload = await response.json();
      if (payload.Result !== true || !payload.Data || !Array.isArray(payload.Data.Items)) {
        throw new Error('Invalid upstream response for '+path);
      }
      return payload.Data;
    } catch (error) {
      if(attempt===attempts-1) throw new Error('Catalog API failed: '+path+' ('+error.message+')');
      await pause(600*(attempt+1));
    }
  }
}
async function pages(kind, param, cityId = CITY_ID, options = {}) {
  const items = [], seen = new Set();
  let lastIndex = 0;
  for(let page=0;page<20;page++) {
    const path = kind==='film'
      ? '/cinema/ci-film/loadMore?apiStatus='+param+'&lastIndex='+encodeURIComponent(lastIndex)+'&count=30&sortType=5&sortDir=1&apiCityId='+cityId
      : '/cinema/ci-cinema/loadMore?t='+Date.now()+'&lastIndex='+encodeURIComponent(lastIndex)+'&count=20&sortType=5&sortDir=2&cineplex='+param+'&apiCityId='+cityId;
    const data=await apiGet(path, options);
    if(!data.Items.length) break;
    for(const item of data.Items) {
      const k=String(item.Id ?? '')+':'+String(item.ApiCinemaId ?? '');
      if(!seen.has(k)){seen.add(k);items.push(item);}
    }
    const next=data.LastIndex || data.Items[data.Items.length-1]?.Id;
    if(!next || String(next)===String(lastIndex) || (data.TotalItems && items.length >= Number(data.TotalItems))) break;
    lastIndex=next;
    await pause(100);
  }
  return items;
}
if (process.argv.includes('--probe')) {
  const [filmPage, cinemaPage] = await Promise.all([
    apiGet('/cinema/ci-film/loadMore?apiStatus=3&lastIndex=0&count=5&sortType=5&sortDir=1&apiCityId=50'),
    apiGet('/cinema/ci-cinema/loadMore?t='+Date.now()+'&lastIndex=0&count=5&sortType=5&sortDir=2&cineplex=6&apiCityId=50')
  ]);
  if (!filmPage.Items.length || !cinemaPage.Items.length) throw new Error('Upstream probe returned empty directory');
  console.log('Upstream probe passed: '+filmPage.Items.length+' film records, '+cinemaPage.Items.length+' cinema records.');
  process.exit(0);
}
const [now,soon] = await Promise.all([pages('film',3),pages('film',2)]);
const movieIds = new Set(), movies = [];
for (const [items,status] of [[now,'now'],[soon,'soon']]) {
  for(const f of items) {
    const id=String(f.Id || '');
    if (!/^[1-9]\d*$/.test(id) || movieIds.has(id) || !f.Title) continue;
    movieIds.add(id);
    movies.push({
      id, title:String(f.Title), titleEn:String(f.TitleEn || ''),
      genre:String(f.ApiGenreName || ''), duration:Number(f.Duration)||0,
      age:String(f.ApiRatingFormat || f.ApiRating || ''),
      posterUrl:String(f.GraphicUrl || f.ImageUrl || ''),
      bannerUrl:String(f.BannerUrl || ''),
      // Trailer URL is optional and must be validated before rendering.
      trailerUrl:String(f.TrailerUrl || f.Trailer || f.YoutubeTrailerUrl || f.YoutubeUrl || f.VideoUrl || ''),
      // MoMo's own trailer clip (direct mp4 on MoMo's CDN) — validated before rendering.
      autoplayTrailer:String(f.ApiAutoplayTrailer || ''),
      // MoMo audience score for this film (point is /10, total is the vote count).
      ratingPoint:typeof f.ApiRatingPoint === 'number' ? f.ApiRatingPoint : null,
      ratingTotal:Number(f.ApiRatingTotal) || 0,
      // Top audience reviews MoMo attaches to the film (TopComments).
      momoReviews:(Array.isArray(f.TopComments) ? f.TopComments : []).slice(0, 3).map(c => ({
        name:String(c.creatorName || 'Khán giả'),
        avatar:String(c.creatorAvatar || ''),
        point:typeof c.point === 'number' ? c.point : null,
        desc:String(c.desc || '').slice(0, 600),
        tags:(Array.isArray(c.tagsV2) ? c.tagsV2 : []).map(t => String(t.keyword || '')).filter(Boolean).slice(0, 4),
        images:(Array.isArray(c.imageUrls) ? c.imageUrls : []).map(u => String(u || '')).filter(u => u.startsWith('https://')).slice(0, 4),
        createdTime:String(c.createdTime || '').slice(0, 19)
      })),
      synopsis:String(f.Synopsis || ''),
      openingDate:String(f.OpeningDate || f.ApiReleaseDate || '').slice(0,10),
      status
    });
  }
}
const chainIds = Object.keys(CHAIN_NAMES).map(Number);

function convertCinemas(rows, cityId) {
  const cinemas = [], seen = new Set();
  for (const c of rows) {
    const chainId = Number(c.Cineplex), apiCinemaId = String(c.ApiCinemaId ?? '');
    const key = chainId + ':' + apiCinemaId;
    if (!CHAIN_NAMES[chainId] || !/^[a-zA-Z0-9_-]+$/.test(apiCinemaId) || !c.Name || seen.has(key)) continue;
    seen.add(key);
    cinemas.push({
      id: String(c.Id ?? ''), chainId, apiCinemaId, name: String(c.Name),
      chain: CHAIN_NAMES[chainId], address: String(c.Address || ''),
      city: String(c.CityName || (cityId === CITY_ID ? 'TP. Hồ Chí Minh' : ''))
    });
  }
  return cinemas.sort((a,b) => a.name.localeCompare(b.name, 'vi'));
}

async function fetchCityCinemas(cityId, options = {}) {
  const rows = [], failed = [];
  for (let i=0;i<chainIds.length;i+=3) {
    const batch = await Promise.allSettled(chainIds.slice(i,i+3)
      .map(id => pages('cinema',id,cityId,options)));
    batch.forEach((result,index) => {
      if (result.status === 'fulfilled') rows.push(...result.value);
      else failed.push({ id:chainIds[i+index], message:result.reason.message });
    });
    // A partial directory must never overwrite a healthy published snapshot.
    if (failed.length) throw new Error('City '+cityId+' chain failures: '+JSON.stringify(failed));
    await pause(100);
  }
  return convertCinemas(rows, cityId);
}

const cinemas = await fetchCityCinemas(CITY_ID);
const previous = JSON.parse(readFileSync(out,'utf8'));
const cinemasByCity = { ...(previous.cinemasByCity || {}) };
for (const cityId of EXTRA_CITY_IDS) {
  try {
    const rows = await fetchCityCinemas(cityId, { timeoutMs:8000, attempts:2 });
    const prior = cinemasByCity[String(cityId)]?.cinemas?.length || 0;
    if (!rows.length || (prior >= 5 && rows.length < Math.ceil(prior*.65))) {
      throw new Error('Empty or partial directory ('+rows.length+' cinemas; previous '+prior+')');
    }
    cinemasByCity[String(cityId)] = { fetchedAt:new Date().toISOString(), cinemas:rows };
    console.log('Refreshed city '+cityId+': '+rows.length+' cinemas');
  } catch (error) {
    // Optional city failure cannot block the primary HCM daily movie refresh.
    // Keep the old timestamp and previous good cinema list when available.
    console.warn('Keeping prior city '+cityId+' directory: '+error.message);
  }
}
const next=validated({
  schemaVersion:1,fetchedAt:new Date().toISOString(),cityId:CITY_ID,
  source:'MoMo Cinema public web API (undocumented)',
  movies,cinemas,cinemasByCity
});
// The initial legacy file includes historical session-only films, so do not
// compare it against the first lean directory refresh. Once a refresh succeeds,
// use the previous daily directory as the fail-closed baseline.
const prevFilms=previous.movies?.length || 0, prevCinemas=previous.cinemas?.length || 0;
// Fail closed on empty/partial provider responses. Never overwrite a healthy
// published snapshot with a suspiciously small refresh.
if(movies.length<5 || cinemas.length<10 ||
  (prevFilms>20 && movies.length<Math.floor(prevFilms*0.35)) ||
  (prevCinemas>20 && cinemas.length<Math.floor(prevCinemas*0.50))) {
  throw new Error('Unusually small catalog refresh: movies='+movies.length+' cinemas='+cinemas.length+
    ' (baseline '+prevFilms+'/'+prevCinemas+') — old file preserved.');
}
const tmpPath=new URL('../src/data/cinema-snapshot.json.tmp',import.meta.url);
writeFileSync(tmpPath,JSON.stringify(next,null,2)+'\n','utf8');
renameSync(tmpPath,out);
console.log('Catalog refreshed:',movies.length,'films,',cinemas.length,'HCM cinemas,',
  Object.entries(cinemasByCity).map(([city, entry]) => city+':'+entry.cinemas.length).join(', '),
  'cached city cinemas. No sessions or seat data fetched.');
