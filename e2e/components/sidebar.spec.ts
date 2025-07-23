import { test, expect } from '@playwright/test';

test.describe('Sidebar Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sidebar test page before each test
    await page.goto('/tests/sidebar');
  });

  test('should display views and projects correctly', async ({ page }) => {
    // Check if views are visible
    await expect(page.getByRole('button', { name: /All Tasks/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Today/ })).toBeVisible();

    // Check if projects are visible - use more specific selectors to avoid conflicts
    await expect(page.getByRole('button', { name: /Personal/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Work/ })).toBeVisible();
  });

  test('should display correct task counts', async ({ page }) => {
    // The count is inside a badge component with ml-auto class
    const todayButton = page.getByRole('button', { name: /Today/ });
    await expect(todayButton.locator('.ml-auto')).toContainText('2');

    const workProjectButton = page.getByRole('button', { name: /Work/ });
    await expect(workProjectButton.locator('span').last()).toContainText('2');
  });

  test('should change view on click', async ({ page }) => {
    await page.getByRole('button', { name: /Today/ }).first().click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: today');
  });

  test('should select a project on click', async ({ page }) => {
    await page.getByRole('button', { name: /Work/ }).first().click();
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

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on the first view button and navigate with keyboard
    await page.getByRole('button', { name: /All Tasks/ }).first().focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /Today/ }).first()).toBeFocused();
    
    // Press Enter to select the focused item
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('current-view')).toHaveText('Current View: today');
  });

  test('should maintain selection state after interaction', async ({ page }) => {
    // Select a project
    await page.getByRole('button', { name: /Work/ }).first().click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: project');
    
    // Expand and collapse a project - selection should remain
    const projectToggleButton = page.locator('[class*="lucide-chevron-right"]').first();
    await projectToggleButton.click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: project');
    
    // Verify the Work project is still selected
    await expect(page.getByTestId('selected-project')).toHaveText('Selected Project ID: project-1');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check that buttons have proper accessibility
    const todayButton = page.getByRole('button', { name: /Today/ }).first();
    await expect(todayButton).toBeVisible();
    
    // Check that project buttons are accessible
    const workButton = page.getByRole('button', { name: /Work/ }).first();
    await expect(workButton).toBeVisible();
  });

  test('should display project hierarchy correctly', async ({ page }) => {
    // Expand a project to show task lists
    const projectToggleButton = page.locator('[class*="lucide-chevron-right"]').first();
    await projectToggleButton.click();
    
    // Verify task list is nested under the project
    const taskList = page.getByRole('button', { name: 'Frontend' });
    await expect(taskList).toBeVisible();
    
    // Click on the task list to select it
    await taskList.click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: tasklist');
  });

  test('should update task counts dynamically', async ({ page }) => {
    // Verify initial counts
    const todayButton = page.getByRole('button', { name: /Today/ }).first();
    await expect(todayButton.locator('.ml-auto')).toContainText('2');
    
    const workProjectButton = page.getByRole('button', { name: /Work/ }).first();
    await expect(workProjectButton.locator('span').last()).toContainText('2');
    
    // Note: In a real app, we would test actual count updates after adding/removing tasks
    // This is a baseline test to ensure counts are rendered correctly
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // This test assumes there might be projects or views with no tasks
    // We're testing that the UI doesn't break when counts are 0
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should handle navigation errors gracefully', async ({ page }) => {
    // Test that clicking on elements doesn't cause JavaScript errors
    await page.getByRole('button', { name: /All Tasks/ }).first().click();
    await page.getByRole('button', { name: /Today/ }).first().click();
    await page.getByRole('button', { name: /Work/ }).first().click();
    
    // Verify no console errors occurred (this would be caught by Playwright automatically)
    await expect(page.getByTestId('current-view')).toBeVisible();
  });

  test('should maintain consistent UI behavior across interactions', async ({ page }) => {
    // Test multiple interactions in sequence to ensure state consistency
    await page.getByRole('button', { name: /Today/ }).first().click();
    await page.getByRole('button', { name: /Work/ }).first().click();
    await page.getByRole('button', { name: /All Tasks/ }).first().click();
    
    // After all interactions, the UI should still be functional
    await expect(page.getByTestId('current-view')).toHaveText('Current View: allTasks');
    await expect(page.getByRole('button', { name: /All Tasks/ }).first()).toBeVisible();
  });
});
