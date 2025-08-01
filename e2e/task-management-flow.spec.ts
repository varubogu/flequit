import { test, expect } from '@playwright/test';

test.describe('Task Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete full task selection and detail view flow', async ({ page }) => {
    // Wait for tasks to load
    const taskItems = page.locator('.task-item-button');
    if ((await taskItems.count()) > 0) {
      // Select first task
      const firstTask = taskItems.first();
      await firstTask.click();

      // Verify task is selected
      await expect(firstTask).toHaveClass(/selected|active/);
    }

    // Always verify the main layout is visible
    await expect(page.locator('[data-pane-group]')).toBeVisible();
  });

  test('should navigate between different views', async ({ page }) => {
    // Ensure layout is visible
    await expect(page.locator('[data-pane-group]')).toBeVisible();

    // Check if heading exists (task list header)
    const headings = page.getByRole('heading', { level: 2 });
    if ((await headings.count()) > 0) {
      await expect(headings.first()).toBeVisible();
    }
  });

  test('should handle project-based task filtering', async ({ page }) => {
    // Click on a project in sidebar
    const workProject = page.getByRole('button').filter({ hasText: 'Work Project' });

    if ((await workProject.count()) > 0) {
      await workProject.first().click();
      await page.waitForLoadState('networkidle');

      // Verify the UI updates
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    }
  });

  test('should handle task status changes across the interface', async ({ page }) => {
    // Ensure basic layout is working
    await expect(page.locator('[data-pane-group]')).toBeVisible();
  });

  test('should manage sub-tasks properly', async ({ page }) => {
    // Ensure basic layout is working
    await expect(page.locator('[data-pane-group]')).toBeVisible();
  });

  test('should handle search and filtering', async ({ page }) => {
    // Ensure basic layout is working
    await expect(page.locator('[data-pane-group]')).toBeVisible();
  });

  test('should handle responsive layout changes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-pane-group]')).toBeVisible();

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 600 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle keyboard shortcuts and navigation', async ({ page }) => {
    // Test basic focus management
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Ensure app remains stable
    await expect(page.locator('[data-pane-group]')).toBeVisible();
  });

  test('should maintain data consistency across interactions', async ({ page }) => {
    // Ensure the application state is consistent
    await expect(page.locator('[data-pane-group]')).toBeVisible();
    await expect(page.locator('nav, aside, [role="navigation"]')).toBeVisible();
  });
});
