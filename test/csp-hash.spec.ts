import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

const root = join(__dirname, '..');

// scripts/update-csp-hash.mjs is a real ES module (Node always treats
// .mjs that way); this test file is transpiled to CommonJS, so it has to
// reach it via dynamic import() rather than a static import.
let extractJsonLd: (html: string) => string;
let computeCspHash: (jsonLd: string) => string;
let applyHashToHeaders: (headers: string, hash: string) => string;

test.beforeAll(async () => {
  ({ extractJsonLd, computeCspHash, applyHashToHeaders } = await import('../scripts/update-csp-hash.mjs'));
});

test.describe('CSP hash for the inline JSON-LD script', () => {
  test('public/_headers hash matches a fresh hash of the current JSON-LD content', () => {
    const html = readFileSync(join(root, 'public/index.html'), 'utf8');
    const headers = readFileSync(join(root, 'public/_headers'), 'utf8');

    const freshHash = computeCspHash(extractJsonLd(html));
    const headersHash = headers.match(/'sha256-([^']+)'/)?.[1];

    expect(headersHash).toBe(freshHash);
  });

  test('changing the JSON-LD content changes the computed hash, correctly', () => {
    const original = readFileSync(join(root, 'public/index.html'), 'utf8');
    const originalJsonLd = extractJsonLd(original);
    const originalHash = computeCspHash(originalJsonLd);

    const changedJsonLd = originalJsonLd.replace('"price": "4500"', '"price": "5000"');
    expect(changedJsonLd).not.toBe(originalJsonLd);

    const changedHash = computeCspHash(changedJsonLd);
    expect(changedHash).not.toBe(originalHash);

    // The computation itself has no hidden dependency on anything but the
    // exact bytes handed in — recomputing independently must agree.
    const independentHash = createHash('sha256').update(changedJsonLd, 'utf8').digest('base64');
    expect(changedHash).toBe(independentHash);
  });

  test('extractJsonLd captures the exact bytes between the tags, not a reformatted copy', () => {
    const html = readFileSync(join(root, 'public/index.html'), 'utf8');
    const jsonLd = extractJsonLd(html);

    // Whitespace-sensitive: this must be the literal bytes the browser
    // hashes, so leading/trailing newlines from the source file survive.
    expect(jsonLd.startsWith('\n')).toBe(true);
    expect(() => JSON.parse(jsonLd)).not.toThrow();
  });

  test('applyHashToHeaders replaces only the sha256 source, leaving the rest of the CSP untouched', () => {
    const headers = readFileSync(join(root, 'public/_headers'), 'utf8');
    const updated = applyHashToHeaders(headers, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');

    expect(updated).toContain("'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='");
    expect(updated).not.toContain(headers.match(/'sha256-([^']+)'/)![0]);

    // Every other directive/line is byte-identical.
    const strip = (s: string) => s.replace(/'sha256-[^']+'/, "'sha256-PLACEHOLDER='");
    expect(strip(updated)).toBe(strip(headers));
  });

  test('extractJsonLd throws a clear error when no inline JSON-LD script is present', () => {
    expect(() => extractJsonLd('<html><head></head><body></body></html>')).toThrow(/ld\+json/);
  });
});
