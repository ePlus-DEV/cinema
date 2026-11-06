# ePlus Cinema

Responsive, mobile-first concept for a Vietnamese cinema discovery and showtimes website.

> [!IMPORTANT]
> **UI preview only.** All movie titles, film descriptions, poster art, dates and showtimes are sample fixtures, not a live schedule. This project does **not** sell tickets or connect to MoMo. Preview pages include a temporary noindex directive until approved data is integrated.

## Features in this layout PR

- Responsive landing page with search, film posters, schedule preview, theaters and an editorial CTA.
- Movie catalog pages for currently showing and upcoming movies, including working keyword/genre filters.
- Movie detail pages with sample showtimes.
- Day selector with responsive cinema/showtime cards.
- Theater directory and individual cinema pages, including name/district search.
- Functional mobile navigation, keyboard-accessible buttons, empty states and demo disclaimers.
- Original CSS poster illustrations (no copied posters, trademarks, or scraped provider assets).
- Static generation with Astro 5, Tailwind CSS 4, GitHub Actions build verification.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Project structure

```text
src/
  components/       # Header, MovieCard, MovieCatalog, DatePicker, ShowtimeList
  data/catalog.ts   # EXPLICITLY MOCK DATA
  layouts/           # Page shell and SEO defaults
  pages/             # Home, films, showtimes, cinemas and detail routes
  styles/            # Responsive design tokens and layouts
public/              # Own SVG icon
.github/workflows/   # CI build
```

## Next phase: real showtime data

Before enabling indexation or ticket booking:

1. Confirm a licensed source/partner API for movie and screening data (MoMo public pages are not an API license).
2. Implement provider adapters with normalization, freshness checks, diagnostics and source attribution.
3. Replace all fixtures with verified records. Distinguish stale, upcoming and unavailable shows; ensure time zone Asia/Ho_Chi_Minh.
4. Add actual cinema addresses, deep links, SEO/schema, sitemap, monitoring, and regression tests.
5. Remove temporary noindex only after real content is available and verified.

The demo does not claim to be affiliated with CGV, Galaxy Cinema, Lotte Cinema, Beta Cinemas, or MoMo.
