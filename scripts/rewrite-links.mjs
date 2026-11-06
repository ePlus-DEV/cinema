#!/usr/bin/env node
/**
 * The initial UI predates deployment and uses root-relative /links.
 * Rewrite only internal URLs in the generated HTML, without altering source/SEO.
 * Assets that Astro already prefixes using \`base\` must not be double-prefixed.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const pathPart = (process.env.PAGES_BASE_PATH || '/cinema/').split('/').filter(Boolean).join('/');
const base = pathPart ? '/' + pathPart + '/' : '/';
const root = 'dist';

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const before = await readFile(full, 'utf8');
      const after = before.replace(
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
