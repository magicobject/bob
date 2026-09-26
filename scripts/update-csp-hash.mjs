#!/usr/bin/env node
// Keeps public/_headers' CSP sha256 source for the inline JSON-LD <script>
// in public/index.html in sync with that script's actual content, so the
// two can never drift apart by hand again the way they did in build
// 2026.09.24.003 ("recomputed the JSON-LD script's CSP hash to match").
//
// Run directly (`npm run build`) to just rewrite public/_headers in place —
// this is what a Cloudflare Pages build command should do before the
// `public/` directory is deployed. Pass --stage-if-index-staged to also
// `git add public/_headers` when public/index.html is already staged for
// the current commit (used by .githooks/pre-commit), mirroring
// bump-build-number.mjs's rule of only touching/staging a derived file
// when its source is already part of the commit being made.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'public/index.html');
const headersPath = join(root, 'public/_headers');

// Captures the exact bytes between the tags — the same bytes a browser
// hashes — not a trimmed or reformatted copy.
export function extractJsonLd(html) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No inline application/ld+json <script> found in public/index.html');
  return match[1];
}

export function computeCspHash(jsonLdContent) {
  return createHash('sha256').update(jsonLdContent, 'utf8').digest('base64');
}

export function applyHashToHeaders(headersContent, hash) {
  const pattern = /'sha256-[^']+'/;
  if (!pattern.test(headersContent)) {
    throw new Error("No 'sha256-...' CSP source found in public/_headers to replace");
  }
  return headersContent.replace(pattern, `'sha256-${hash}'`);
}

function main() {
  const html = readFileSync(indexPath, 'utf8');
  const hash = computeCspHash(extractJsonLd(html));

  const headers = readFileSync(headersPath, 'utf8');
  const updated = applyHashToHeaders(headers, hash);

  if (updated === headers) {
    console.log(`CSP hash already up to date: sha256-${hash}`);
    return;
  }

  writeFileSync(headersPath, updated);
  console.log(`Updated public/_headers CSP hash to sha256-${hash}`);

  if (process.argv.includes('--stage-if-index-staged')) {
    const stagedFiles = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: root })
      .toString()
      .split('\n')
      .filter(Boolean);
    if (stagedFiles.includes('public/index.html')) {
      execFileSync('git', ['add', 'public/_headers'], { cwd: root });
    }
  }
}

// pathToFileURL, not a hand-built `file://${argv[1]}` — on Windows that's
// never equal to import.meta.url (backslashes, no third slash), so main()
// silently never ran from the pre-commit hook or `npm run build` there.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
