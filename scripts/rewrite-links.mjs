#!/usr/bin/env node
/**
 * The initial UI predates deployment and uses root-relative /links.
 * Rewrite only internal URLs in the generated HTML, without altering source/SEO.
 * Assets that Astro already prefixes using \`base\` must not be double-prefixed.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const pathPart = (process.env.PAGES_BASE_PATH || '/').split('/').filter(Boolean).join('/');
const base = pathPart ? '/' + pathPart + '/' : '/';
const root = 'dist';

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const before = await readFile(full, 'utf8');
      // Astro has occasionally emitted page slot content AFTER </html> with
      // an empty <main>. Browsers then display the footer before the page.
      // Repair the generated document while preserving all page scripts.
      // This is intentionally strict; CI fails if the unexpected shape changes.
      let html = before;
      const mainEmpty = /<main\s+id=["']main-content["']\s*>\s*<\/main>/i;
      const htmlClose = html.lastIndexOf('</html>');
      if (htmlClose >= 0 && mainEmpty.test(html)) {
        const tail = html.slice(htmlClose + '</html>'.length).trim();
        if (tail) {
          if (!/^<(?:section|div|article|main|script|header|nav|aside|style|template)\b/i.test(tail)) {
            throw new Error('Unexpected content after </html> in ' + full);
          }
          const body = html.slice(0, htmlClose + '</html>'.length);
          html = body.replace(mainEmpty, '<main id="main-content">' + tail + '</main>');
          console.log('Restored misplaced page slot inside main:', full);
        }
      }
      const after = html.replace(
        /(\b(?:href|src|action|poster)=)(["'])\/(?!\/)([^"']*)\2/g,
        (match, attribute, quote, url) => {
          if (base !== '/' && url.startsWith(base.slice(1))) return match;
          return attribute + quote + base + url + quote;
        }
      );
      await writeFile(full, after, 'utf8');
    }
  }
}

await walk(root);
console.log('Normalized root-relative links to Pages base ' + base);
