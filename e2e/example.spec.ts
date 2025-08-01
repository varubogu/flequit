import { test, expect } from '@playwright/test';

test('application loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check that the main application elements are present
  await expect(page.locator('body')).toBeVisible();

  // Wait for the app to fully load
  await page.waitForLoadState('networkidle');

  // Verify basic layout components
  await expect(page.locator('nav, aside, [role="navigation"]')).toBeVisible();
});

test('basic navigation works', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Test basic sidebar navigation
  await expect(page.locator('nav, aside, [role="navigation"]')).toBeVisible();

  // Test main content area
  await expect(page.locator('[data-pane-group]')).toBeVisible();
});
