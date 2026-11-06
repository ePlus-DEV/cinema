import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://cinema.eplus.dev',
  vite: { plugins: [tailwindcss()] },
  build: { format: 'directory' }
});
