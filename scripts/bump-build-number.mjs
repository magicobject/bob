#!/usr/bin/env node
// Increments build-number.json's per-day counter and stamps the new number
// into public/updates.html's footer — the only page that carries a build
// number. index.html and 404.html don't get touched on every commit, so a
// build number there would just go stale; matching the convention in
// kington-parishes and MediaWright, the build number lives only on the
// unlinked /updates changelog page.
// Format: yyyy.mm.dd.xxx, xxx = build count for that day.
//
// Deliberately does NOT patch+stage updates.html unless it's already part
// of this commit: an earlier version unconditionally ran `git add` on every
// page regardless of what was staged, which silently swept an unrelated,
// still-unstaged edit (the DNA air filter upgrade card) into a commit
// whose message only described a favicon change (build 2026.09.17.001).
// Since updates.html needs a new changelog entry for every commit anyway,
// it's always staged already, so this is mostly a defensive guard now.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'build-number.json');

const today = new Date();
const date = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('.');

let state = { date, build: 0 };
if (existsSync(file)) {
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  if (saved.date === date) state = saved;
}

state.build += 1;
const buildNumber = `${date}.${String(state.build).padStart(3, '0')}`;

writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
execFileSync('git', ['add', 'build-number.json'], { cwd: root });

const stagedFiles = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: root })
  .toString()
  .split('\n')
  .filter(Boolean);

const PAGES = ['public/updates.html'];
for (const page of PAGES) {
  if (!stagedFiles.includes(page)) continue;
  const path = join(root, page);
  if (!existsSync(path)) continue;
  const html = readFileSync(path, 'utf8');
  const patched = html.replace(/(<span class="build-number">Build )[^<]*(<\/span>)/, `$1${buildNumber}$2`);
  if (patched !== html) {
    writeFileSync(path, patched);
    execFileSync('git', ['add', page], { cwd: root });
  }
}

console.log(`Build number: ${buildNumber}`);
