import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PAGES_SITE_ORIGIN || 'https://eplus-dev.github.io';
const requestedBase = process.env.PAGES_BASE_PATH || '/cinema/';
const segments = requestedBase.split('/').filter(Boolean);

if (segments.some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment))) {
  throw new Error('PAGES_BASE_PATH contains an invalid URL segment');
}
const base = segments.length ? '/' + segments.join('/') + '/' : '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
  build: { format: 'directory' }
});
