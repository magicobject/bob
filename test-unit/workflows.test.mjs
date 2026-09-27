// Guards on the GitHub Actions workflows themselves: a workflow is code with
// write access to the repo, so it gets the same scrutiny as any other code.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', '.github', 'workflows');
// Only workflows that already meet these rules are guarded. volunteer-edit.yml
// is left out on purpose: it still uses movable tags (actions/checkout@v4,
// actions/setup-node@v4, actions/cache@v4) and needs contents/pull-requests
// write to commit a volunteer's edit. Add it here once it's pinned.
const GUARDED = ['vuln-watch.yml'];
const workflows = readdirSync(dir).filter((f) => GUARDED.includes(f)).map((f) => ({ file: f, text: readFileSync(join(dir, f), 'utf8') }));

test('every guarded workflow exists', () => {
  assert.deepEqual(workflows.map((w) => w.file).sort(), [...GUARDED].sort());
});

describe('guarded workflows', () => {
  for (const { file, text } of workflows) {
    test(`${file}: every action is pinned to a full commit SHA, not a movable tag`, () => {
      const uses = [...text.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1]);
      assert.ok(uses.length > 0);
      for (const ref of uses) assert.match(ref, /@[0-9a-f]{40}$/, `${file}: ${ref} is not pinned to a commit`);
    });

    test(`${file}: declares its permissions explicitly, and never grants write-all`, () => {
      assert.match(text, /^permissions:/m);
      assert.doesNotMatch(text, /write-all/);
    });
  }
});

describe('vuln-watch.yml', () => {
  const text = readFileSync(join(dir, 'vuln-watch.yml'), 'utf8');

  test('runs daily and can be run on demand', () => {
    assert.match(text, /schedule:\s*\n\s*- cron: '\d+ \d+ \* \* \*'/);
    assert.match(text, /workflow_dispatch:/);
  });

  test('can only read code and write issues', () => {
    assert.match(text, /contents: read/);
    assert.match(text, /issues: write/);
    assert.doesNotMatch(text, /contents: write|pull-requests: write/);
  });

  test('installs without running package install scripts', () => {
    assert.match(text, /npm ci --ignore-scripts/);
  });
});

test('Dependabot watches both npm packages and the pinned actions', () => {
  const path = join(import.meta.dirname, '..', '.github', 'dependabot.yml');
  assert.ok(existsSync(path));
  const text = readFileSync(path, 'utf8');
  assert.match(text, /package-ecosystem: npm/);
  assert.match(text, /package-ecosystem: github-actions/);
});
