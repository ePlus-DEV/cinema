# ePlus Cinema

Responsive, mobile-first concept for a Vietnamese cinema discovery and showtimes website.

> [!IMPORTANT]
> **UI preview only.** All movie titles, film descriptions, poster art, dates, and showtimes are sample fixtures, not live cinema schedules. This project does **not** sell tickets or connect to MoMo. All current pages have **noindex** until approved real data is integrated.

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

## Next phase: real showtime data

1. Confirm a licensed partner/source API for movie and screening data (public MoMo pages are not an API license).
2. Normalize and validate scheduled screenings, availability, time zone, and source attribution.
3. Replace all fixtures with real authorized records and only then review the temporary noindex rule.
4. Add map integration, booking deep links, sitemap, monitoring, and regression tests.

The demo does not claim affiliation with CGV, Galaxy Cinema, Lotte Cinema, Beta Cinemas or MoMo.
