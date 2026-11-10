#!/usr/bin/env node
/**
 * MoMo is a showtime DATA SOURCE, not a destination for ticket booking on this
 * preview. Prevent accidental outbound navigation while keeping API requests.
 */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function walk(directory, extensions) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(full, extensions));
    else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) paths.push(full);
  }
  return paths;
}

function isMomoDestination(raw) {
  try {
    const url = new URL(raw, 'https://cinema.eplus.dev');
    return url.hostname === 'momo.vn' || url.hostname.endsWith('.momo.vn');
  } catch {
    return false;
  }
}

let inspectedPages = 0;
const pages = await walk('dist', ['.html']);
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  inspectedPages++;
  for (const anchor of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    assert.ok(!isMomoDestination(anchor[2]), `Outbound MoMo anchor in ${page}: ${anchor[2]}`);
  }
  // Redirects (including meta refresh) should not send visitors to MoMo.
  assert.doesNotMatch(html, /<meta\b[^>]*http-equiv=["']refresh["'][^>]*momo\.vn/i, `MoMo redirect in ${page}`);
}

for (const source of await walk('src', ['.astro', '.js', '.ts'])) {
  const code = await readFile(source, 'utf8');
  // Catch dynamically-rendered anchors or navigation omitted from static HTML.
  assert.doesNotMatch(code, /<a\b[^>]*\bhref\s*=\s*["'`][^"'`]*https?:\/\/(?:[\w-]+\.)*momo\.vn/gi, `Outbound MoMo link in ${source}`);
  assert.doesNotMatch(code, /(?:window\.)?(?:location\.(?:href|assign|replace)|open)\s*(?:=|\()\s*["'`]https?:\/\/(?:[\w-]+\.)*momo\.vn/gi, `MoMo navigation in ${source}`);
}
assert.ok(inspectedPages > 0, 'No generated pages found to audit');
console.log(`PASS: ${inspectedPages} generated pages and source files contain no visitor navigation to MoMo`);
