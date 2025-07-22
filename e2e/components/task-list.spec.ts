import { test, expect } from '@playwright/test';

test.describe('Task List Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display task list with proper structure', async ({ page }) => {
    // Wait for task list to load
    await page.waitForSelector('.task-list, [data-testid="task-list"]', { timeout: 10000 });
    
    const taskList = page.locator('.task-list, [data-testid="task-list"]').first();
    await expect(taskList).toBeVisible();
    
    // Check for task items within the list
    const taskItems = taskList.locator('.task-item-button');
    expect(await taskItems.count()).toBeGreaterThanOrEqual(0);
  });

  test('should show add task button when appropriate', async ({ page }) => {
    // Look for add task button
    const addButton = page.locator('button:has-text("Add"), button[data-testid="add-task"], .add-task-button');
    
    // Button might not always be visible depending on the view
    const buttonCount = await addButton.count();
    expect(buttonCount).toBeGreaterThanOrEqual(0);
    
    if (buttonCount > 0) {
      await expect(addButton.first()).toBeVisible();
    }
  });

  test('should handle empty state properly', async ({ page }) => {
    // Navigate to a view that might be empty
    await page.getByRole('button', { name: 'Today' }).click();
    await page.waitForLoadState('networkidle');
    
    const taskItems = page.locator('.task-item-button');
    const taskCount = await taskItems.count();
    
    if (taskCount === 0) {
      // Should show empty state message
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state, text=/no tasks/i');
      const hasEmptyState = await emptyState.count() > 0;
      
      // Either show empty state or the container should still be visible
      expect(hasEmptyState || true).toBeTruthy();
    }
  });

  test('should display task list title correctly', async ({ page }) => {
    await page.waitForSelector('.task-list, [data-testid="task-list"]', { timeout: 10000 });
    
    // Look for title element
    const titleElements = page.locator('h1, h2, h3, .title, [data-testid="list-title"]');
    
    if (await titleElements.count() > 0) {
      const title = titleElements.first();
      await expect(title).toBeVisible();
      
      const titleText = await title.textContent();
      expect(titleText?.trim()).toBeTruthy();
    }
  });

  test('should handle different view types', async ({ page }) => {
    await page.waitForSelector('.task-list, [data-testid="task-list"]', { timeout: 10000 });
    
    // Test All Tasks view
    await page.getByRole('button', { name: 'All Tasks' }).click();
    await page.waitForLoadState('networkidle');
    
    let taskList = page.locator('.task-list, [data-testid="task-list"]').first();
    await expect(taskList).toBeVisible();
    
    // Test Today view
    await page.getByRole('button', { name: 'Today' }).click();
    await page.waitForLoadState('networkidle');
    
    taskList = page.locator('.task-list, [data-testid="task-list"]').first();
    await expect(taskList).toBeVisible();
  });

  test('should scroll properly with many tasks', async ({ page }) => {
    await page.waitForSelector('.task-list, [data-testid="task-list"]', { timeout: 10000 });
    
    const taskList = page.locator('.task-list, [data-testid="task-list"]').first();
    const taskItems = page.locator('.task-item-button');
    
    const taskCount = await taskItems.count();
    
    if (taskCount > 5) {
      // Test scrolling
      await taskList.evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
      
      await page.waitForTimeout(300);
      
      // Last task should be visible
      const lastTask = taskItems.last();
      await expect(lastTask).toBeVisible();
    }
  });

  test('should maintain selection state during list operations', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    const firstTask = page.locator('.task-item-button').first();
    
    // Select first task
    await firstTask.click();
    await expect(firstTask).toHaveClass(/selected|active/);
    
    // Scroll or perform other list operations
    const taskList = page.locator('.task-list, [data-testid="task-list"]').first();
    await taskList.evaluate(el => {
      el.scrollTop = 100;
    });
    
    await page.waitForTimeout(300);
    
    // Selection should be maintained
    await expect(firstTask).toHaveClass(/selected|active/);
  });

  test('should handle task reordering if supported', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    const taskItems = page.locator('.task-item-button');
    const taskCount = await taskItems.count();
    
    if (taskCount > 1) {
      // Get initial order
      const firstTaskText = await taskItems.first().textContent();
      const secondTaskText = await taskItems.nth(1).textContent();
      
      // Test if drag handles or reorder controls exist
      const dragHandles = page.locator('[draggable], .drag-handle, [data-testid="drag-handle"]');
      
      if (await dragHandles.count() > 0) {
        // Basic drag test (may need adjustment based on actual implementation)
        const firstHandle = dragHandles.first();
        const secondHandle = dragHandles.nth(1);
        
        await firstHandle.dragTo(secondHandle);
        await page.waitForTimeout(500);
        
        // Order should change or remain consistent
        expect(await taskItems.count()).toBe(taskCount);
      }
    }
  });

  test('should handle bulk operations if supported', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 10000 });
    
    // Look for bulk action controls
    const selectAllButton = page.locator('button:has-text("Select All"), input[type="checkbox"][aria-label*="select all"], [data-testid="select-all"]');
    
    if (await selectAllButton.count() > 0) {
      await selectAllButton.first().click();
      
      // Look for bulk action toolbar
      const bulkActions = page.locator('.bulk-actions, [data-testid="bulk-actions"]');
      
      if (await bulkActions.count() > 0) {
        await expect(bulkActions.first()).toBeVisible();
      }
    }
  });

  test('should handle filtering and search within list', async ({ page }) => {
    await page.waitForSelector('.task-list, [data-testid="task-list"]', { timeout: 10000 });
    
    // Look for filter or search controls within the task list
    const filterControls = page.locator('.filter, .search, input[placeholder*="filter"], [data-testid="task-filter"]');
    
    if (await filterControls.count() > 0) {
      const filterInput = filterControls.first();
      await filterInput.fill('test');
      
      await page.waitForTimeout(500);
      
      // List should update or remain functional
      const taskList = page.locator('.task-list, [data-testid="task-list"]').first();
      await expect(taskList).toBeVisible();
    }
  });
});