import { test, expect } from '@playwright/test';

test.describe('Sidebar Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/sidebar');
  });

  test('should display views and projects correctly', async ({ page }) => {
    // Check if views are visible
    await expect(page.getByRole('button', { name: 'All Tasks' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();

    // Check if projects are visible
    await expect(page.getByRole('button', { name: 'Work' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Personal' })).toBeVisible();
  });

  test('should display correct task counts', async ({ page }) => {
    // The count is inside a badge, which is a sibling to the label
    const todayButton = page.getByRole('button', { name: 'Today' });
    await expect(todayButton.locator('span').last()).toHaveText('1');

    const workProjectButton = page.getByRole('button', { name: 'Work' });
    await expect(workProjectButton.locator('span').last()).toHaveText('2');
  });

  test('should change view on click', async ({ page }) => {
    await page.getByRole('button', { name: 'Today' }).click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: today');
  });

  test('should select a project on click', async ({ page }) => {
    await page.getByRole('button', { name: 'Work' }).click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: project');
    await expect(page.getByTestId('selected-project')).toHaveText('Selected Project ID: project-1');
  });

  test('should expand and collapse a project', async ({ page }) => {
    const projectToggleButton = page.locator('[class*="lucide-chevron-right"]').first();

    // Task list should not be visible initially
    await expect(page.getByRole('button', { name: 'Frontend' })).not.toBeVisible();

    // Expand the project
    await projectToggleButton.click();
    await expect(page.getByRole('button', { name: 'Frontend' })).toBeVisible();

    // Collapse the project
    await projectToggleButton.click();
    await expect(page.getByRole('button', { name: 'Frontend' })).not.toBeVisible();
  });
});
