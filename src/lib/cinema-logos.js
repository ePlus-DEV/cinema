/**
 * Cinema-chain image assets published alongside the chain names on the public
 * MoMo Cinema directory. These are presentation-only external images.
 * Never link visitors to the provider for booking; render an accessible
 * typographic brand fallback if a CDN asset is unavailable.
 */
export const CHAIN_LOGOS = Object.freeze({
  3: 'https://homepage.momocdn.net/blogscontents/momo-upload-api-210604170453-637584230934981809.png',
  4: 'https://homepage.momocdn.net/blogscontents/momo-upload-api-210604170511-637584231119272266.png',
  5: 'https://homepage.momocdn.net/blogscontents/momo-upload-api-210604170530-637584231309495829.png',
  6: 'https://homepage.momocdn.net/cinema/momo-amazone-s3-api-240829164527-638605467276820522.png',
  7: 'https://img.mservice.io/momo_app_v2/new_version/img/THAO.MAI/DcineLogo.png',
  8: 'https://homepage.momocdn.net/blogscontents/momo-upload-api-210604170617-637584231772974269.png',
  9: 'https://homepage.momocdn.net/cinema/momo-upload-api-211123095138-637732578984425272.png',
  10: 'https://homepage.momocdn.net/cinema/momo-upload-api-210813104719-637644484394328824.png',
  16: 'https://homepage.momocdn.net/cinema/momo-upload-api-221108100132-638034984925107129.png',
  17: 'https://cinema.momocdn.net/XS/starlight/image.png',
  18: 'https://homepage.momocdn.net/img/momo-amazone-s3-api-250505103419-638820380597920724.png',
  20: 'https://homepage.momocdn.net/cinema/ncclogo-260325100933.png',
  21: 'https://homepage.momocdn.net/img/aeonbetalogo-zip-260706160816.jpg'
});
export const CHAIN_SHORT_LABELS = Object.freeze({
  3: 'BHD', 4: 'MEGA', 5: 'CINESTAR', 6: 'CGV', 7: 'DCINE', 8: 'LOTTE',
  9: 'GALAXY', 10: 'BETA', 16: 'CINEMAX', 17: 'STARLIGHT', 18: 'RIO',
  19: 'TOUCH', 20: 'NCC', 21: 'AEON BETA', 22: 'METIZ'
});
export function createChainLogo(chainId, name, className = 'chain-logo') {
  const holder = document.createElement('span');
  holder.className = className;
  const fallback = document.createElement('span');
  fallback.className = className + '__fallback';
  fallback.textContent = CHAIN_SHORT_LABELS[chainId] || name || 'RẠP';
  const src = CHAIN_LOGOS[chainId];
  if (src) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => { image.remove(); holder.classList.add('is-fallback'); });
    image.addEventListener('load', () => { fallback.hidden = true; });
    holder.append(image);
  }
  holder.append(fallback);
  return holder;
}
