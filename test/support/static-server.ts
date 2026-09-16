// Minimal static file server for the test suite (and `npm run serve`).
// Serves an exact-path file when one exists, otherwise responds with
// public/404.html and a 404 status — mirrors how Cloudflare Pages/Workers
// assets serving behaves in production.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(__dirname, '..', '..', 'public');
const PORT = Number(process.env.PORT ?? 4177);

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
};

function decodedUrlPath(urlPath: string): string {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  return decoded === '/' || decoded === '' ? '/index.html' : decoded;
}

// Resolve the request path against ROOT and verify the *fully resolved*
// absolute path is still inside it, rather than sanitising the input string
// first — path.resolve follows the current platform's separator rules, and
// on Windows that includes backslash, so a POSIX-only string check
// (stripping literal "../") can be defeated with "..\\" or its URL-encoded
// form. Checking the resolved output is safe regardless of which separator
// or encoding a traversal attempt used.
function resolveWithinRoot(urlPath: string): string | null {
  const filePath = resolve(join(ROOT, decodedUrlPath(urlPath)));
  return filePath === ROOT || filePath.startsWith(ROOT + sep) ? filePath : null;
}

const server = createServer(async (req, res) => {
  const filePath = resolveWithinRoot(req.url ?? '/');

  try {
    if (!filePath) throw new Error('path escapes public/');
    const body = await readFile(filePath);
    const type = CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(body);
  } catch {
    try {
      const notFoundBody = await readFile(join(ROOT, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(notFoundBody);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

// Bind to loopback only — this is dev/test tooling, not something that
// should be reachable from the rest of the network while `npm test`/
// `npm run serve` is running.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Static test server serving ${ROOT} at http://localhost:${PORT}`);
});
