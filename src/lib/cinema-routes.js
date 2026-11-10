/** Stable URL paths derived only from upstream IDs; no unsafe slug injection. */
export function moviePath(id, base = '/') {
  const safe = String(id ?? '').trim();
  return /^[1-9][0-9]*$/.test(safe) ? base + 'phim/' + safe + '/' : null;
}
export function cinemaPath(chainId, apiCinemaId, base = '/') {
  const chain = String(chainId ?? '');
  const id = String(apiCinemaId ?? '');
  return /^[1-9][0-9]*$/.test(chain) && /^[a-zA-Z0-9_-]+$/.test(id)
    ? base + 'rap/' + chain + '-' + id + '/' : null;
}
