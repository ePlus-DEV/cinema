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
> **Cinema discovery preview.** Movie and theater directories and their detail pages are pre-rendered from a daily catalog snapshot. Showtime and seat data are fetched live. The feed is an undocumented third-party API, not a licensed partner source; ePlus Cinema does **not** sell tickets or redirect visitors to MoMo for booking. Indexing remains gated until content rights are verified.

## Features

- Responsive landing page, current/upcoming movies and movie details.
- Search movie and cinema directories without waiting for an API response.
- Live date/venue filtering, showtime and seat-map preview.
- Pre-generated HTML for individual film and cinema detail URLs, with provider poster images and source attribution.
- GitHub Pages automated production deployment **and per-PR preview links**.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
npm run build
node scripts/smoke-test.mjs
node scripts/seo-audit.mjs
npm run preview
```


## Daily film and cinema catalog

- Workflow: `.github/workflows/cinema-catalog-daily.yml`, one scheduled run
  each day at **01:10 Asia/Ho_Chi_Minh (18:10 UTC)**, plus an optional manual
  `workflow_dispatch`. A one-time `push` bootstrap also runs automatically
  when the workflow is first merged to `main` (or when that workflow file
  itself changes, or the catalog sync script changes to bootstrap new city
  directories). Normal unrelated source commits do not re-fetch the catalog.
- Downloads **only film and cinema directory data** for TP. Hồ Chí Minh
  (`apiCityId=50`) using the same unsigned/public-web API access pattern
  already in this repository. It does **not** download ticket availability,
  showtime sessions or seat maps.
- The output `src/data/cinema-snapshot.json` is validated before being
  committed. Empty/partial/errors do not replace a previously good snapshot.
- The same daily job also caches **cinema directories only** for Đồng Nai,
  Hà Nội, Đà Nẵng, Bình Dương and Bà Rịa–Vũng Tàu as
  `cinemasByCity` with individual `fetchedAt` timestamps. Failed or partial
  extra-city refreshes retain the previous good entry and do **not** block the
  primary TP.HCM refresh. The first merge of the upgraded sync script triggers
  a one-time refresh even if the HCM snapshot already ran that day, so Đồng
  Nai can be populated without waiting for the next cron run. The schedule explorer renders available directory
  seeds immediately and persists other selected cities in per-city browser
  cache. **Session times and seat availability are never cached**; they are
  fetched live only after selecting a cinema/date.
  Until the initial success, the existing `momo-showtimes.json` inventory
  seeds actual pre-rendered pages; its old showtime entries are not served.
- Pages and directories render from the catalog at **build time**, not from
  a client-side request. URLs are `/phim/<id>/` and
  `/rap/<chainId>-<apiCinemaId>/`. Legacy query detail URLs redirect to
  static routes when the ID already exists in the snapshot. If a new film
  appears before the next refresh, its legacy query detail remains the fallback.
- Live showtime and seat components **still call the API from the browser**.
  Source changes or outages cannot be masked as confirmed seat availability.
- Uses the built-in `GITHUB_TOKEN`, not a PAT. The bot commits to `main` and
  explicitly dispatches the existing `pages-stage.yml` workflow because
  normal push events created by `GITHUB_TOKEN` do not launch other workflows.
  Branch-protection rejection will fail the job; no force push or bypass.
- After merge, verify the first automatic run under **Actions → Refresh cinema catalog daily**.
  Manual rerun is available through **Run workflow**. Review the resulting
  commit and downstream Pages deployment. To validate an existing
  local snapshot without network access: `npm run check:catalog`.
- **Rights:** the upstream API is not a licensed feed. Do not enable search
  indexing/booking or expand geographic coverage without validation.

### Generated HTML order safeguard

Astro has emitted the page slot **after** `</html>` in the current build
configuration, causing the real footer to display before the homepage on
mobile Safari. `scripts/rewrite-links.mjs` now restores any trailing page
sections inside the empty `<main>` before the footer and normalizes preview
links. This runs automatically after `npm run build`. The smoke tests
verify that all primary pages have valid main/footer order.

### GitHub Actions deduplication

- **PR CI** runs only on pull requests. New commits cancel obsolete PR
  checks through a per-PR concurrency group. Production `main` builds and
  smoke checks are performed by Pages Staging, not duplicate CI jobs.
- **Pages Staging** serializes writes to the shared `gh-pages` branch.
  Separate PR-close/production events remain queued, but stale PR HEADs,
  superseded `main` SHA values and already-staged commits are detected
  before dependency installation. Each staged preview carries an
  `.eplus-preview-sha` marker; production has `.eplus-production-sha`.
  HEAD is verified again immediately before publishing.
- **Pages Publishing** is dispatched only after a successful push that
  actually changes `gh-pages`. A stage with no changes **does not**
  dispatch another Pages deployment. The deployment workflow runs from
  `main` with `workflow_dispatch`, not `workflow_run: completed`.
- **Catalog refresh** still has one daily schedule at 01:10 Vietnam time.
  If the snapshot was already fetched on that Vietnam calendar date, the
  job skips loading and deployment. A manual workflow run with
  `force=true` explicitly overrides the same-day check. Bot commits fetch
  and rebase against the latest `main` before attempting a non-force push;
  conflicts fail closed, preserving existing data.
- GitHub Actions concurrency itself only prevents overlapping executions;
  preserving independent preview deletions is why staging uses
  `queue: max` with per-event freshness checks, not a blanket
  `cancel-in-progress: true`. See `scripts/check-actions-dedup.mjs` for
  CI-validated safety invariants.

## GitHub Pages deployment

Two workflows work together:

1. **Build and stage GitHub Pages** (`.github/workflows/pages-stage.yml`):
   - `push` to `main`: build production and publish its files to the root of the `gh-pages` branch, preserving other PR previews.
   - `pull_request` opened/synchronized/reopened: build the PR branch and store it in `gh-pages/previews/pr-N/`. Works for **branches within this repository only**, not forks.
   - `pull_request` closed/merged: remove `previews/pr-N/`.
   - `workflow_dispatch`: manually rebuild production from `main`.
   - Builds run with `persist-credentials: false`; the publish step receives the scoped `GITHUB_TOKEN` separately.
2. **Publish GitHub Pages** (`.github/workflows/pages-publish.yml`):
   - Runs from the repository's **default branch** only when staging pushes a **real change** to `gh-pages` and dispatches the publisher.
   - Checks out the complete `gh-pages` branch, uploads one Pages artifact and deploys it with GitHub's official `actions/deploy-pages`.
   - Does not execute PR source code and avoids deploying directly from a PR context.
   - For an updated same-repository PR preview, receives its PR number and exact head SHA from staging. After a **successful** Pages deployment it creates or updates one marked bot comment with the preview URL; stale or closed PRs are ignored.

This staging/deployment split is necessary because public GitHub Pages does not offer native isolated PR preview deployments. Commits made by `GITHUB_TOKEN` do not trigger normal push workflows, so staging explicitly sends one `workflow_dispatch` after each changed `gh-pages` commit. A no-op staging run sends none. Preview folders are part of the same complete Pages site.

### One-time GitHub setup (required)

1. Merge the deployment PR so both workflow files are on `main`.
2. Visit **Repository → Settings → Pages** and set **Build and deployment → Source → GitHub Actions**. Do **not** select `Deploy from a branch` for this configuration.
3. In **Settings → Actions → General**, ensure workflows can use the scoped `GITHUB_TOKEN` with `contents: write` and `actions: write` for staging and `issues: write` for the trusted publishing notifier. If the organization restricts writable workflow tokens, an administrator must adjust the repository policy.
4. Under **Settings → Environments → github-pages**, allow default-branch deployments. The trusted publishing workflow runs from `main`.
5. Trigger **Actions → Build and stage GitHub Pages → Run workflow** on `main` for the first production release (or use the automatic `main` push).
6. Check **Actions → Publish GitHub Pages** for successful deployment.

**Default production URL (after successful deployment):**

https://cinema.eplus.dev/

**Example preview URL (for PR #3, only after that PR is staged and published):**

https://cinema.eplus.dev/previews/pr-3/

Each PR preview URL appears in the staging workflow run Summary. After **Publish GitHub Pages** succeeds, a separate trusted default-branch notification job (with `issues: write` and `pull-requests: write`) posts/updates a single `github-actions[bot]` comment on the PR with the link `https://cinema.eplus.dev/previews/pr-N/` (using `issues: write` on the built-in `GITHUB_TOKEN`, no PAT). Re-runs update the same marked comment, not a new one. When a production publish has no specific PR input, the notifier also backfills open PRs whose current HEAD matches a staged preview marker (no dummy PR commit needed). If organization policy blocks bot comments, the publishing run reports that error, and the staging Summary remains available. URLs are live only after successful Pages deployment; closing a PR removes its preview path.

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
  pages-publish.yml # Dispatch-only GitHub Pages deployment
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

## Trailers and movie reviews

- Every pre-rendered movie detail page includes a responsive **Trailer & review**
  area between its synopsis and its live showtime schedule. The legacy
  `/phim/chi-tiet/?id=...` fallback populates the same section once film
  metadata is received.
- Trailer sources are taken from the daily film feed only if they are valid
  YouTube video URLs/IDs. `src/data/movie-editorial.js` contains a small,
  film-specific set of manually verified official uploads and published
  editorial review **links**. Never assign an unrelated search result to a
  movie or copy third-party articles/comments into the site.
- YouTube's privacy-enhanced player (`youtube-nocookie.com`) is created only
  after a user presses **Phát trailer**. No media player or audio autoplays on
  initial page load. Missing/unverified trailers show a clearly labeled
  YouTube **search** link, not an invented embedded video.
- **Đánh giá của bạn** lets visitors choose 1–5 stars, write a short note,
  mark spoilers, save/update, and delete their own entry. It is stored only
  in that browser's `localStorage`, keyed by movie ID. There is no account,
  public comment database, global average, shared review feed, or fake
  community statistics. Clearing browser data removes the review.
- No Movie `Review` or `AggregateRating` structured data is emitted until
  public reviews are genuinely stored and available in rendered content.
  Existing `noindex` and unlicensed-source restrictions remain unchanged.
- To verify: `node scripts/movie-extras-test.mjs` after a build or in CI.
