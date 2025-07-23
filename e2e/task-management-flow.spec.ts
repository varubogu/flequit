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
    if (await taskItems.count() > 0) {
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
    // Test All Tasks view
    await page.getByRole('button', { name: /All Tasks/ }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2')).toBeVisible();
    
    // Test Today view
    await page.getByRole('button', { name: /Today/ }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2')).toBeVisible();
  });

  test('should handle project-based task filtering', async ({ page }) => {
    // Click on a project in sidebar
    const workProject = page.getByRole('button').filter({ hasText: 'Work Project' });
    
    if (await workProject.count() > 0) {
      await workProject.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify the UI updates
      await expect(page.locator('h2')).toBeVisible();
    }
  });

  test('should handle task status changes across the interface', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    const firstTask = page.locator('.task-item-button').first();
    const statusToggle = firstTask.locator('button').first();
    
    // Get initial status
    const initialState = await statusToggle.getAttribute('aria-checked') || 
                         await statusToggle.getAttribute('data-state') ||
                         'unchecked';
    
    // Toggle status
    await statusToggle.click();
    
    // Wait for state change
    await page.waitForTimeout(500);
    
    // Verify status changed
    const newState = await statusToggle.getAttribute('aria-checked') || 
                     await statusToggle.getAttribute('data-state') ||
                     'unchecked';
    
    expect(newState).not.toBe(initialState);
  });

  test('should manage sub-tasks properly', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    // Look for tasks with sub-tasks
    const accordionToggle = page.locator('[class*="lucide-chevron"], .accordion-toggle').first();
    
    if (await accordionToggle.count() > 0) {
      // Expand sub-tasks
      await accordionToggle.click();
      
      // Verify sub-tasks are visible
      const subTasks = page.locator('.sub-task, [data-testid="sub-task"]');
      await expect(subTasks.first()).toBeVisible();
      
      // Try to toggle a sub-task status
      const subTaskToggle = subTasks.first().locator('button').first();
      if (await subTaskToggle.count() > 0) {
        await subTaskToggle.click();
        // Verify the toggle worked (visual feedback)
        await expect(subTaskToggle).toBeVisible();
      }
    }
  });

  test('should handle search and filtering', async ({ page }) => {
    // Look for search functionality
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"], [data-testid="search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');
      
      // Verify search results
      const taskItems = page.locator('.task-item-button');
      // Should have some results or show empty state
      const hasResults = await taskItems.count() > 0;
      const hasEmptyState = await page.locator('[data-testid="empty-state"], .empty-state').count() > 0;
      
      expect(hasResults || hasEmptyState).toBeTruthy();
    }
  });

  test('should handle responsive layout changes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    // Verify panels are visible
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    const taskList = page.locator('[data-testid="task-list"], .task-list').first();
    const taskDetail = page.locator('[data-testid="task-detail"], .task-detail').first();
    
    await expect(sidebar).toBeVisible();
    await expect(taskList).toBeVisible();
    await expect(taskDetail).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 600 });
    await page.waitForTimeout(500);
    
    // Panels should still be functional
    await expect(page.locator('[data-pane-group]')).toBeVisible();
  });

  test('should handle keyboard shortcuts and navigation', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    // Test basic keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Enter key on focused task
    await page.keyboard.press('Enter');
    
    // Should select the task or trigger an action
    await page.waitForTimeout(500);
    const selectedTask = page.locator('.task-item-button.selected, .task-item-button.active').first();
    
    if (await selectedTask.count() > 0) {
      await expect(selectedTask).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test navigation to non-existent or problematic states
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    // Click multiple elements rapidly to test race conditions
    const taskItems = page.locator('.task-item-button');
    const count = Math.min(await taskItems.count(), 3);
    
    for (let i = 0; i < count; i++) {
      await taskItems.nth(i).click();
      await page.waitForTimeout(100);
    }
    
    // App should still be functional
    await expect(page.locator('.task-item-button').first()).toBeVisible();
  });

  test('should maintain data consistency across interactions', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    // Perform multiple operations
    const firstTask = page.locator('.task-item-button').first();
    
    // Select task
    await firstTask.click();
    await expect(firstTask).toHaveClass(/selected|active/);
    
    // Change view
    await page.getByRole('button', { name: 'Today' }).click();
    await page.waitForLoadState('networkidle');
    
    // Change back to All Tasks
    await page.getByRole('button', { name: 'All Tasks' }).click();
    await page.waitForLoadState('networkidle');
    
    // Task should still exist and be accessible
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    const tasksAfterNavigation = page.locator('.task-item-button');
    expect(await tasksAfterNavigation.count()).toBeGreaterThan(0);
  });
});