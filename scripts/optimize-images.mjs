// One-off image pipeline: reads the full-res camera photos out of
// originals/ (gitignored — they're 2-4MB each straight off a phone) and
// writes the sized, compressed versions actually served from public/images/.
// Re-run with `npm run optimize-images` any time a photo in originals/
// changes; nothing here runs as part of `npm test` or a deploy.
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const SRC_DIR = new URL('../originals/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT_DIR = new URL('../public/images/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const WIDTHS = [480, 800, 1200, 1600];

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

for (const file of files) {
  const name = basename(file, extname(file));
  const input = join(SRC_DIR, file);
  const srcMeta = await sharp(input).metadata();

  for (const width of WIDTHS) {
    if (width > srcMeta.width) continue;
    await sharp(input).rotate().resize({ width }).jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT_DIR, `${name}-${width}.jpg`));
    await sharp(input).rotate().resize({ width }).webp({ quality: 76 }).toFile(join(OUT_DIR, `${name}-${width}.webp`));
  }

  console.log(`optimized ${file} -> ${name}-{${WIDTHS.join(',')}}.{jpg,webp}`);
}

// Social-share crop: fixed 1200x630 (the OG/Twitter card ratio), cropped
// from the hero shot rather than just downscaling it, so the bike stays the
// focal point instead of getting letterboxed.
const heroInput = join(SRC_DIR, 'hero.jpg');
await sharp(heroInput)
  .rotate()
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(join(OUT_DIR, 'og-image.jpg'));
console.log('optimized hero.jpg -> og-image.jpg (1200x630)');
