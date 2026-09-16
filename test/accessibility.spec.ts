import { test, expect } from './support/fixtures';
import { AxeBuilder } from '@axe-core/playwright';
import { ALL_PAGES } from './support/pages';

const ALL_PATHS = [...ALL_PAGES.map((p) => p.path), '/404.html'];

function formatViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']): string {
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `    - ${n.target.join(' ')}\n      ${n.failureSummary?.replace(/\n/g, ' ')}`).join('\n');
      return `[${v.impact}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join('\n\n');
}

for (const path of ALL_PATHS) {
  test(`axe: ${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    // Force-settle the reveal-on-scroll animation so this tests the real
    // final state, not a mid-transition frame — an element still fading in
    // from opacity:0 reads as low-contrast to axe, which isn't a real bug.
    // Adding the .in class alone isn't enough (it starts a fresh 0.6s
    // transition rather than jumping to the end state), so the transition
    // itself is killed too.
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('in');
        (el as HTMLElement).style.transition = 'none';
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
    });

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
}

// axe-core's heading-order check is tagged best-practice, not WCAG A/AA, so
// it's excluded from AxeBuilder's default analyze() ruleset. This checks it
// directly instead — a heading's level may never jump more than one deeper
// than the highest level seen so far on the page (dropping back down is
// always fine; skipping forward, e.g. h1 straight to h3, is not).
for (const path of ALL_PATHS) {
  test(`heading outline: ${path} has no skipped heading levels`, async ({ page }) => {
    await page.goto(path);
    const levels = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) => els.map((el) => Number(el.tagName[1])));

    let maxSeen = 0;
    for (const level of levels) {
      expect(
        level,
        `heading order on ${path} was [${levels.join(', ')}] — level ${level} appears after only reaching h${maxSeen}`,
      ).toBeLessThanOrEqual(maxSeen + 1);
      maxSeen = Math.max(maxSeen, level);
    }
  });
}

test.describe('gallery lightbox', () => {
  test('axe: homepage with lightbox open', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('in');
        (el as HTMLElement).style.transition = 'none';
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
    });
    await page.locator('#gallery-grid button').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});
