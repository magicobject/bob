// Every spec imports `test`/`expect` from here instead of directly from
// '@playwright/test'. This blocks any request that isn't to our own
// static-server, so a slow or flaky external fetch (there aren't any right
// now, but this keeps it true if one is added later) can't stall the suite.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
    await use(page);
  },
});

export { expect };
