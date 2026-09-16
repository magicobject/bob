import { test, expect } from './support/fixtures';

test.describe('listing content', () => {
  test('shows the price, mileage and no-offers note', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.getByText('£4,500', { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/no offers/i).first()).toBeVisible();
    await expect(page.getByText(/7,800 miles/i)).toBeVisible();
  });

  test('shows working contact links', async ({ page }) => {
    await page.goto('/index.html');
    const phone = page.locator('a[href="tel:+447449301083"]');
    await expect(phone).toBeVisible();
    await expect(phone).toHaveText('07449 301083');

    const email = page.locator('a[href^="mailto:"]');
    await expect(email).toHaveCount(1);
  });

  test('lists all nine upgrades', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#upgrades .upgrade-card')).toHaveCount(9);
  });

  test('maintenance history table has all four service entries', async ({ page }) => {
    await page.goto('/index.html');
    const rows = page.locator('table.maintenance tbody tr');
    await expect(rows).toHaveCount(4);
    await expect(rows.first()).toContainText('Hitchcocks Freeflow');
  });

  test('gallery has ten photos openable in a lightbox', async ({ page }) => {
    await page.goto('/index.html');
    const thumbs = page.locator('#gallery-grid button');
    await expect(thumbs).toHaveCount(10);

    await thumbs.nth(2).click();
    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toBeVisible();
    await expect(page.locator('#lightbox-image')).toHaveAttribute('src', /gallery-02-1200\.jpg/);

    await page.locator('#lightbox-close').click();
    await expect(lightbox).toBeHidden();
  });

  test('footer credits mediawright.uk', async ({ page }) => {
    await page.goto('/index.html');
    const credit = page.getByRole('link', { name: 'mediawright.uk' });
    await expect(credit).toHaveAttribute('href', 'https://mediawright.uk');
  });
});

test.describe('404 handling', () => {
  test('unknown paths get the 404 page with a link home', async ({ page }) => {
    const response = await page.goto('/no-such-page.html');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to the listing/i })).toHaveAttribute('href', '/index.html');
  });
});
