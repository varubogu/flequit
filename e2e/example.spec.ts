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

  // Test basic view navigation
  const allTasksButton = page.getByRole('button', { name: /All Tasks/ });
  if (await allTasksButton.count() > 0) {
    await allTasksButton.first().click();
    await expect(page.locator('.task-list-container, [class*="task"], main')).toBeVisible();
  }
});
