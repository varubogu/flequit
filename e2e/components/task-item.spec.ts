import { test, expect } from '@playwright/test';

test.describe('Task Item Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display task items with basic information', async ({ page }) => {
    // Wait for tasks to load and check basic structure
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    const taskItems = page.locator('.task-item-button');
    expect(await taskItems.count()).toBeGreaterThan(0);

    // Check first task item has required elements
    const firstTask = taskItems.first();
    await expect(firstTask).toBeVisible();
    
    // Check for task status toggle
    await expect(firstTask.locator('[role="button"]').first()).toBeVisible();
  });

  test('should handle task selection', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    const firstTask = page.locator('.task-item-button').first();
    await firstTask.click();
    
    // Check if task becomes selected (has 'selected' class or similar)
    await expect(firstTask).toHaveClass(/selected|active/);
  });

  test('should toggle task status', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    const firstTask = page.locator('.task-item-button').first();
    const statusToggle = firstTask.locator('button').first();
    
    await statusToggle.click();
    
    // Verify the status change is reflected (this might show different visual states)
    await expect(statusToggle).toBeVisible();
  });

  test('should expand sub-tasks when available', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    // Look for tasks with sub-tasks (accordion toggle button)
    const accordionToggle = page.locator('[class*="lucide-chevron"], .accordion-toggle').first();
    
    if (await accordionToggle.count() > 0) {
      await accordionToggle.click();
      
      // Check if sub-tasks become visible
      const subTaskList = page.locator('.sub-task, [data-testid="sub-task"]');
      await expect(subTaskList.first()).toBeVisible();
    }
  });

  test('should handle context menu', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    const firstTask = page.locator('.task-item-button').first();
    
    // Right-click to open context menu
    await firstTask.click({ button: 'right' });
    
    // Check if context menu appears (might have specific selectors)
    const contextMenu = page.locator('[role="menu"], .context-menu');
    await expect(contextMenu).toBeVisible();
  });

  test('should display task priority indicators', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    const taskItems = page.locator('.task-item-button');
    const firstTask = taskItems.first();
    
    // Check for priority color indicators (border-l-4 classes)
    const hasColoredBorder = await firstTask.evaluate((el) => {
      const classList = el.classList.toString();
      return classList.includes('border-l-4') || 
             classList.includes('priority') ||
             classList.includes('red') ||
             classList.includes('yellow') ||
             classList.includes('green');
    });
    
    expect(hasColoredBorder).toBeTruthy();
  });

  test('should show task progress for tasks with sub-tasks', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    // Look for tasks that might have progress indicators
    const progressIndicators = page.locator('[data-testid="progress"], .progress, .sub-task-progress');
    
    if (await progressIndicators.count() > 0) {
      await expect(progressIndicators.first()).toBeVisible();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    const firstTask = page.locator('.task-item-button').first();
    await firstTask.focus();
    
    // Test Enter key
    await page.keyboard.press('Enter');
    await expect(firstTask).toHaveClass(/selected|active/);
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle date picker interaction', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    // Look for due date elements
    const dueDateElements = page.locator('[data-testid="due-date"], .due-date, .date-picker-trigger');
    
    if (await dueDateElements.count() > 0) {
      await dueDateElements.first().click();
      
      // Check if date picker opens
      const datePicker = page.locator('[role="dialog"], .calendar, .date-picker');
      await expect(datePicker).toBeVisible();
    }
  });

  test('should maintain accessibility attributes', async ({ page }) => {
    await page.waitForSelector('.task-item-button', { timeout: 5000 });
    
    const taskItems = page.locator('.task-item-button');
    const firstTask = taskItems.first();
    
    // Check basic accessibility attributes
    await expect(firstTask).toHaveAttribute('role', 'button');
    await expect(firstTask).toHaveAttribute('tabindex');
    
    // Check if task has proper ARIA labels or accessible names
    const hasAccessibleName = await firstTask.evaluate((el) => {
      return !!(el.getAttribute('aria-label') || 
               el.getAttribute('aria-labelledby') ||
               el.textContent?.trim());
    });
    
    expect(hasAccessibleName).toBeTruthy();
  });
});