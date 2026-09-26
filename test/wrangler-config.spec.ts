import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

// The local static server (test/support/static-server.ts) always serves
// 404.html for unknown paths, so the 404 tests pass regardless of how
// Cloudflare is configured. In production that only happens if the Worker's
// assets config says so — without `not_found_handling: "404-page"`,
// Cloudflare returns an empty 404 body instead. Guard the config itself.
test.describe('wrangler.jsonc', () => {
  const config = JSON.parse(readFileSync(join(__dirname, '..', 'wrangler.jsonc'), 'utf8'));

  test('deploys to the existing "bob" Worker', () => {
    expect(config.name).toBe('bob');
  });

  test('serves public/404.html for unknown paths', () => {
    expect(config.assets.directory).toBe('./public');
    expect(config.assets.not_found_handling).toBe('404-page');
  });
});
