import { test, expect } from '@playwright/test';

test.describe('Main Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load main application layout', async ({ page }) => {
    // Check that the main components are visible
    await expect(page.locator('nav, aside, [role="navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-list"], .task-list')).toBeVisible();
    await expect(page.locator('[data-testid="task-detail"], .task-detail')).toBeVisible();
  });

  test('should display resizable panels', async ({ page }) => {
    // Check for resizable pane structure
    const resizableHandle = page.locator('[data-pane-group][data-direction="horizontal"]');
    await expect(resizableHandle).toBeVisible();
  });

  test('should handle view navigation', async ({ page }) => {
    // Test view switching from sidebar
    await page.getByRole('button', { name: 'All Tasks' }).click();
    await expect(page.locator('.task-list')).toBeVisible();

    await page.getByRole('button', { name: 'Today' }).click();
    await expect(page.locator('.task-list')).toBeVisible();
  });

  test('should maintain responsive layout', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-pane-group]')).toBeVisible();

    await page.setViewportSize({ width: 800, height: 600 });
    await expect(page.locator('[data-pane-group]')).toBeVisible();
  });
});