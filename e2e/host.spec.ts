import { test, expect } from '@playwright/test';

test('debug server host', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Flequit - Task Management/);
});
