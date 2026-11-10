# ePlus Cinema

## Technical SEO readiness (indexing deliberately disabled)

- Unique `title` and `description` on the home, now-showing, coming-soon,
  cinemas and showtimes pages; canonical URLs always use
  `https://cinema.eplus.dev/`, not a pull-request preview URL.
- Open Graph and Twitter summary metadata; valid JSON-LD `WebSite`,
  `WebPage`, and `BreadcrumbList` for **actual, static, visible** site
  navigation. No invented Movie/LocalBusiness ratings, prices, or showtimes.
- Auto-generated `/robots.txt` and `/sitemap.xml`. The sitemap lists
  only the five stable editorial/discovery routes when indexing is enabled.
  Legacy `/lich-chieu/momo/` canonicalizes to `/lich-chieu/`.
  Demo fixture slugs and browser-rendered query pages stay `noindex`;
  the latter do not emit a misleading canonical URL.
- **Current policy:** `SEO_INDEXABLE=false` by default. This preserves the
  existing noindex restriction while the MoMo data feed is undocumented and
  its reuse/rights are unverified. Do not enable Search indexing just
  because metadata or sitemap files exist.
- After validating content rights, metadata quality, actual indexable text
  in initial HTML (including film/cinema-specific URLs), and the site's
  public readiness, set the GitHub **repository variable**
  `CINEMA_SEO_INDEXABLE=true` and trigger the normal production build.
  Only five stable routes become `index,follow`; PR previews remain
  `noindex,nofollow` regardless of the variable.
- Use `node scripts/seo-audit.mjs` after `npm run build`, plus
  Rich Results Test, Search Console URL Inspection, and sitemap submission
  once an indexing launch is actually approved. Those Google checks
  cannot be verified by the local CI alone.
- Social preview images (`og:image` / `twitter:image`) are intentionally
  not published until a verified public raster cover asset is available;
  no broken or unowned preview image is advertised.


Responsive, mobile-first concept for a Vietnamese cinema discovery and showtimes website.

> [!IMPORTANT]
> **UI preview only.** The homepage and live schedule use a third-party MoMo data feed for discovery, while movie detail/catalog and other pages still contain sample fixtures. ePlus Cinema does **not** sell tickets or redirect visitors to MoMo for booking. All pages remain **noindex** until authorized data is available.

## Features

- Responsive landing page, current/upcoming movies and movie details.
- Search and genre filtering.
- Sample date switching and showtime cards.
- Theater directory and individual theater pages.
- Original illustrated posters without copying movie provider artwork.
- GitHub Pages automated production deployment **and per-PR preview links**.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
npm run build
node scripts/rewrite-links.mjs
node scripts/smoke-test.mjs
npm run preview
```

## GitHub Pages deployment

Two workflows work together:

1. **Build and stage GitHub Pages** (`.github/workflows/pages-stage.yml`):
   - `push` to `main`: build production and publish its files to the root of the `gh-pages` branch, preserving other PR previews.
   - `pull_request` opened/synchronized/reopened: build the PR branch and store it in `gh-pages/previews/pr-N/`. Works for **branches within this repository only**, not forks.
   - `pull_request` closed/merged: remove `previews/pr-N/`.
   - `workflow_dispatch`: manually rebuild production from `main`.
   - Builds run with `persist-credentials: false`; the publish step receives the scoped `GITHUB_TOKEN` separately.
2. **Publish GitHub Pages** (`.github/workflows/pages-publish.yml`):
   - Runs from the repository's **default branch** after the staging workflow succeeds.
   - Checks out the complete `gh-pages` branch, uploads one Pages artifact and deploys it with GitHub's official `actions/deploy-pages`.
   - Does not execute PR source code and avoids deploying directly from a PR context.

This staging/deployment split is necessary because public GitHub Pages does not offer native isolated PR preview deployments, and commits made by `GITHUB_TOKEN` alone do **not** reliably trigger a Pages publish. Our preview folders are part of the same complete GitHub Pages site.

### One-time GitHub setup (required)

1. Merge the deployment PR so both workflow files are on `main`.
2. Visit **Repository → Settings → Pages** and set **Build and deployment → Source → GitHub Actions**. Do **not** select `Deploy from a branch` for this configuration.
3. In **Settings → Actions → General**, ensure workflows can use the repository-scoped `GITHUB_TOKEN` with the requested `contents: write` permission. If your organization restricts writable workflow tokens, an administrator must allow the necessary policy.
4. Under **Settings → Environments → github-pages**, allow default-branch deployments. The trusted publishing workflow runs from `main`.
5. Trigger **Actions → Build and stage GitHub Pages → Run workflow** on `main` for the first production release (or use the automatic `main` push).
6. Check **Actions → Publish GitHub Pages** for successful deployment.

**Default production URL (after successful deployment):**

https://cinema.eplus.dev/

**Example preview URL (for PR #3, only after that PR is staged and published):**

https://cinema.eplus.dev/previews/pr-3/

Each PR preview URL appears in the staging workflow run Summary. Automatic PR comments are intentionally not required because organization token policies may prevent issue comments. URLs are only live after the downstream `Publish GitHub Pages` workflow succeeds. Closing a PR removes its preview path.

### Custom domain: cinema.eplus.dev

The domain `cinema.eplus.dev` is the default target for this repository. Production builds use the root path `/` and PR previews use `/previews/pr-N/`. **No Actions variables are required.** The GitHub Actions deployment pins `PAGES_SITE_ORIGIN=https://cinema.eplus.dev` and `PAGES_ROOT_PATH=/` so outdated repository variables cannot accidentally publish under `/cinema/`. Local Astro builds can still override these values for testing.

For the first deployment:

1. In **Settings → Pages → Custom domain**, confirm `cinema.eplus.dev` has been saved for **this** repository.
2. In DNS, the `cinema` subdomain should have a CNAME pointing to `eplus-dev.github.io` (without `https://`, and **without** `/cinema/`). Allow DNS and HTTPS certificate propagation.
3. Under **Settings → Pages**, choose **Source: GitHub Actions**. With a custom Actions deployment, a file called `CNAME` is not required.
4. Merge the deployment PR and run the production staging workflow on `main`, then verify the trusted publish workflow succeeds.
5. Enable **Enforce HTTPS** when GitHub offers the option. Validate production and PR routes on both desktop and mobile.

**Production URL:** https://cinema.eplus.dev/

**Preview URL format:** https://cinema.eplus.dev/previews/pr-N/

Note: setting a domain in GitHub Pages does not confirm its DNS, certificate or successful publication. Check the Pages domain diagnostics and the Actions deployment before sharing the website.

### Notes and security

- Preview pages are **publicly accessible**; a preview URL is not a security boundary. Never put secrets or private information in the generated site.
- Fork PRs intentionally do not receive deploy permissions or previews.
- All content stays `noindex` until legitimate, verified movie data is available.
- Production and preview share a single Pages site; deploy serialization protects other PR previews.
- No Cloudflare account, Pages API token, or third-party deployment service is required.

## Source layout

```text
src/
  components/       # Header, films, date picker, showtimes
  data/catalog.ts   # Explicit mock data
  layouts/           # Site shell
  pages/             # Film, theater and schedule routes
  styles/            # Responsive design
scripts/
  rewrite-links.mjs # Route-prefix fix for GitHub Pages and PR previews
  smoke-test.mjs    # Generated page + asset sanity tests
  publish-pages.sh  # Preserve production and PR previews in gh-pages
.github/workflows/
  ci.yml            # Pull-request static build
  pages-stage.yml   # Build and stage production / previews
  pages-publish.yml # Official GitHub Pages deployment
```

## Real showtime data from MoMo (experimental)

The pages `/lich-chieu/` and `/lich-chieu/momo/` load showtimes **live in the visitor's browser**
from the same API the public MoMo Cinema schedule page
(<https://www.momo.vn/cinema/lich-chieu>) uses:

- Client: `src/lib/momo-client.js`, driven by `src/components/MomoShowtimeList.astro`.
  It lists cinemas (`GET /cinema/ci-cinema/loadMore`), then loads one cinema's
  sessions for the selected date (`POST /v2/cinema/session` →
  `Films[].VersionsCaptions[].ShowTimes[]`).
- API base: `https://aws.momo.vn/momovn-cinema/public`, signed per request with
  the same `X-Client-Token` scheme the web app uses (AES-256-CBC + MD5 of the
  body, computed with Web Crypto in the browser).
- MoMo only sends CORS headers for its own origin, so requests go through a
  CORS proxy configured by the **`PUBLIC_MOMO_CORS_PROXY`** env variable
  (see `.env.example`; the Pages workflow sets it from the repository variable
  of the same name, defaulting to the ePlus cors-anywhere instance on Heroku).
- Both pages stay `noindex` and sell no tickets. Showtime buttons open the **on-site seat-map preview**. Home cinema cards preserve the selected cinema in an internal query parameter; there are no visitor-facing MoMo booking links.

An offline snapshot path also exists for development:
`scripts/fetch-momo-showtimes.mjs` makes the same calls from Node and writes
`src/data/momo-showtimes.json`:

```bash
npm run fetch:showtimes -- [--city=50] [--cineplex=6] [--days=3] [--date=YYYY-MM-DD]
```

- This is an **undocumented public web API, not a licensed partner feed** — keep
  the attribution and the `noindex` rule until a licensed source is confirmed.

## Next phase: real showtime data

1. Confirm a licensed partner/source API for movie and screening data (public MoMo pages are not an API license).
2. Normalize and validate scheduled screenings, availability, time zone, and source attribution.
3. Replace all fixtures with real authorized records and only then review the temporary noindex rule.
4. Add map integration, booking deep links, sitemap, monitoring, and regression tests.

The demo does not claim affiliation with CGV, Galaxy Cinema, Lotte Cinema, Beta Cinemas or MoMo.

## Live discovery and detail page routes

The main UI is **film-first**: the homepage opens with "Phim đang chiếu" rather than a decorative hero. The movie directories and `/rap/` use live client-side MoMo data, **not** legacy fixture catalogs.

GitHub Pages is static. To support newly listed movies and cinemas without rebuilding on every new item, details use internal query parameters:

- `/phim/chi-tiet/?id=<film.Id>`: live poster, synopsis, genres, duration, age rating and screening dates (where supplied), plus a film-filtered showtime explorer for currently showing films.
- `/rap/chi-tiet/?cinema=<chainId>:<apiCinemaId>`: cinema name, chain, address and a date-filtered schedule for that specific cinema.
- `/lich-chieu/`: the complete live schedule; the legacy `/lich-chieu/momo/` route remains available.

The query parameters are identifiers; displayed fields are fetched from the source. No MoMo booking redirects are used. All pages retain `noindex, nofollow` because this feed is not licensed. Legacy mock `/phim/[slug]/` and `/rap/[slug]/` routes remain for compatibility but are not linked by the real-data navigation.

### Cinema schedule explorer (PR #4 UI refinement)

- Location: the existing feed is configured for **TP. Hồ Chí Minh** only
  (`apiCityId=50`). The location selector filters **districts actually
  present in loaded cinema addresses**. It does not pretend to have verified
  city IDs for other provinces. Do not present nationwide availability without
  a verified source/city ID mapping.
- Venue chain and cinema cards show external provider-hosted **chain logo
  images**, with accessible typography fallbacks if an asset fails to load.
  Brand images belong to their owners; the project does not claim ownership.
- The main schedule has a single full-width viewer: city/district, chain rail,
  theater list, date picker, film times, then an internal seat-map preview.
  The modal is **not** a checkout and does not hold/book seats.
- No visitor-facing outbound links to MoMo were added. Live API/CDN
  dependencies remain third-party and may fail separately from the UI.
