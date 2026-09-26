// Types for scripts/update-csp-hash.mjs, imported by test/csp-hash.spec.ts.
export function extractJsonLd(html: string): string;
export function computeCspHash(jsonLdContent: string): string;
export function applyHashToHeaders(headersContent: string, hash: string): string;
