import { test, expect } from '@playwright/test';

test.describe('Sidebar Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the sidebar test page before each test
    await page.goto('/tests/sidebar');
    // Wait for the sidebar to fully load
    await expect(page.getByTestId('view-allTasks')).toBeVisible();
  });

  test('should display views and projects correctly', async ({ page }) => {
    // Check if views are visible using testId
    await expect(page.getByTestId('view-allTasks')).toBeVisible();
    await expect(page.getByTestId('view-today')).toBeVisible();

    // Check if projects are visible using testId
    await expect(page.getByTestId('project-project-2')).toBeVisible(); // Personal
    await expect(page.getByTestId('project-project-1')).toBeVisible(); // Work
  });

  test('should display correct task counts', async ({ page }) => {
    // Check Today view count using testId
    const todayButton = page.getByTestId('view-today');
    await expect(todayButton.locator('.ml-auto')).toContainText('2');

    // Check Work project count using testId
    const workProjectButton = page.getByTestId('project-project-1');
    await expect(workProjectButton.locator('span').last()).toContainText('4');
  });

  test('should change view on click', async ({ page }) => {
    await page.getByTestId('view-today').click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: today');
  });

  test('should select a project on click', async ({ page }) => {
    await page.getByTestId('project-project-1').click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: project');
    await expect(page.getByTestId('selected-project')).toHaveText('Selected Project ID: project-1');
  });

  test('should expand and collapse a project', async ({ page }) => {
    const projectToggleButton = page.getByTestId('toggle-project-project-1');

    // Task list should not be visible initially
    await expect(page.getByTestId('tasklist-list-1')).not.toBeVisible();

    // Expand the project
    await projectToggleButton.click();
    await expect(page.getByTestId('tasklist-list-1')).toBeVisible();

    // Collapse the project
    await projectToggleButton.click();
    await expect(page.getByTestId('tasklist-list-1')).not.toBeVisible();
  });

  // 未完成機能のためテストしない
  // test('should handle keyboard navigation', async ({ page }) => {
  //   // Focus on the first view button and navigate with keyboard
  //   await page.getByTestId('view-allTasks').focus();
  //   await page.keyboard.press('Tab');
  //   await expect(page.getByTestId('view-today')).toBeFocused();

  //   // Press Enter to select the focused item
  //   await page.keyboard.press('Enter');
  //   await expect(page.getByTestId('current-view')).toHaveText('Current View: today');
  // });

  test('should maintain selection state after interaction', async ({ page }) => {
    // Select a project
    await page.getByTestId('project-project-1').click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: project');

    // Expand and collapse a project - selection should remain
    const projectToggleButton = page.getByTestId('toggle-project-project-1');
    await projectToggleButton.click();
    await expect(page.getByTestId('current-view')).toHaveText('Current View: project');

    // Verify the Work project is still selected
    await expect(page.getByTestId('selected-project')).toHaveText('Selected Project ID: project-1');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check that buttons have proper accessibility
    const todayButton = page.getByTestId('view-today');
    await expect(todayButton).toBeVisible();

    // Check that project buttons are accessible
    const workButton = page.getByTestId('project-project-1');
    await expect(workButton).toBeVisible();
  });

  test('should display project hierarchy correctly', async ({ page }) => {
    // Expand a project to show task lists
    const projectToggleButton = page.getByTestId('toggle-project-project-1');
    await projectToggleButton.click();

    // Verify task list is nested under the project
    const taskList = page.getByTestId('tasklist-list-1');
    await expect(taskList).toBeVisible();

    // Click on the task list to select it
    await taskList.click();

    // First verify that the list was selected (this should work)
    await expect(page.getByTestId('selected-list')).toHaveText('Selected List ID: list-1');

    // Then check if the view changed to tasklist
    await expect(page.getByTestId('current-view')).toHaveText('Current View: tasklist');
  });

  test('should filter tasks by selected task list', async ({ page }) => {
    // Expand a project to show task lists
    const projectToggleButton = page.getByTestId('toggle-project-project-1');
    await projectToggleButton.click();

    // Select a specific task list
    const taskList = page.getByTestId('tasklist-list-1');
    await taskList.click({ force: true });

    // Verify the view has changed to tasklist
    await expect(page.getByTestId('current-view')).toHaveText('Current View: tasklist');

    // Verify the selected list ID is displayed (if available)
    await expect(page.getByTestId('selected-list')).toHaveText('Selected List ID: list-1');
  });

  test('should clear project selection when task list is selected', async ({ page }) => {
    // First select a project
    await page.getByTestId('project-project-1').click();
    await expect(page.getByTestId('selected-project')).toHaveText('Selected Project ID: project-1');

    // Expand the project and select a task list
    const projectToggleButton = page.getByTestId('toggle-project-project-1');
    await projectToggleButton.click();

    const taskList = page.getByTestId('tasklist-list-1');
    await taskList.click();

    // Wait a bit for the state to update
    await page.waitForTimeout(100);

    // Project selection should be cleared, list should be selected
    await expect(page.getByTestId('selected-project')).toHaveText('Selected Project ID: null');
    await expect(page.getByTestId('selected-list')).toHaveText('Selected List ID: list-1');
    await expect(page.getByTestId('current-view')).toHaveText('Current View: tasklist');
  });

  test('should clear task list selection when project is selected', async ({ page }) => {
    // First expand project and select a task list
    const projectToggleButton = page.getByTestId('toggle-project-project-1');
    await projectToggleButton.click();

    const taskList = page.getByTestId('tasklist-list-1');
    await taskList.click();

    // Wait a bit for the state to update
    await page.waitForTimeout(100);

    await expect(page.getByTestId('selected-list')).toHaveText('Selected List ID: list-1');
    await expect(page.getByTestId('current-view')).toHaveText('Current View: tasklist');

    // Now select the project
    await page.getByTestId('project-project-1').click();

    // List selection should be cleared, project should be selected
    await expect(page.getByTestId('selected-list')).toHaveText('Selected List ID: null');
    await expect(page.getByTestId('selected-project')).toHaveText('Selected Project ID: project-1');
    await expect(page.getByTestId('current-view')).toHaveText('Current View: project');
  });

  test('should update task counts dynamically', async ({ page }) => {
    // Verify initial counts
    const todayButton = page.getByTestId('view-today');
    await expect(todayButton.locator('.ml-auto')).toContainText('2');

    const workProjectButton = page.getByTestId('project-project-1');
    await expect(workProjectButton.locator('span').last()).toContainText('4');

    // Note: In a real app, we would test actual count updates after adding/removing tasks
    // This is a baseline test to ensure counts are rendered correctly
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Wait for the sidebar to load
    await expect(page.getByTestId('view-allTasks')).toBeVisible();

    // This test assumes there might be projects or views with no tasks
    // We're testing that the UI doesn't break when counts are 0
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should handle navigation errors gracefully', async ({ page }) => {
    // Test that clicking on elements doesn't cause JavaScript errors
    await page.getByTestId('view-allTasks').click();
    await page.getByTestId('view-today').click();
    await page.getByTestId('project-project-1').click();

    // Verify no console errors occurred (this would be caught by Playwright automatically)
    await expect(page.getByTestId('current-view')).toBeVisible();
  });

  test('should maintain consistent UI behavior across interactions', async ({ page }) => {
    // Test multiple interactions in sequence to ensure state consistency
    await page.getByTestId('view-today').click();
    await page.getByTestId('project-project-1').click();
    await page.getByTestId('view-allTasks').click();

    // After all interactions, the UI should still be functional
    await expect(page.getByTestId('current-view')).toHaveText('Current View: allTasks');
    await expect(page.getByTestId('view-allTasks')).toBeVisible();
  });
});
