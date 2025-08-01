import { test, expect } from '@playwright/test';

test.describe('Mobile Sidebar Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('モバイル表示でサイドバーの背景色が正しく設定されている', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // モバイル用サイドバートグルボタンをクリック
    const toggleButton = page.getByTestId('mobile-sidebar-toggle');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // サイドバーが表示されるまで待機
    await page.waitForSelector('[data-sidebar="sidebar"]');

    // サイドバーの背景色をチェック
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // 背景色が設定されていることを確認
    const sidebarStyles = await sidebar.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color
      };
    });

    // 背景色が透明ではないことを確認
    expect(sidebarStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(sidebarStyles.backgroundColor).not.toBe('transparent');

    // 内部のdiv要素も背景色を持っていることを確認
    const innerDiv = sidebar.locator('div').first();
    const innerStyles = await innerDiv.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return computedStyle.backgroundColor;
    });

    expect(innerStyles).not.toBe('rgba(0, 0, 0, 0)');
    expect(innerStyles).not.toBe('transparent');
  });

  test('デスクトップ表示でサイドバーが正しく表示される', async ({ page }) => {
    // デスクトップビューポートに設定
    await page.setViewportSize({ width: 1024, height: 768 });

    // デスクトップではサイドバーが常に表示
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // モバイル用トグルボタンは表示されない
    const mobileToggle = page.getByTestId('mobile-sidebar-toggle');
    await expect(mobileToggle).not.toBeVisible();
  });

  test('サイドバーのコンテンツが正しく表示される', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // サイドバーを開く
    const toggleButton = page.getByTestId('mobile-sidebar-toggle');
    await toggleButton.click();

    // サイドバーのコンテンツ要素が表示されることを確認
    await expect(page.getByText('Views')).toBeVisible();
    await expect(page.getByText('All Tasks')).toBeVisible();

    // サイドバーが背景の上に表示され、タスクリストと重ならないことを確認
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const taskList = page.getByTestId('task-list');

    // z-indexやposition設定を確認
    const sidebarStyles = await sidebar.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        position: computedStyle.position,
        zIndex: computedStyle.zIndex
      };
    });

    // サイドバーが適切にレイヤーされていることを確認
    expect(['fixed', 'absolute']).toContain(sidebarStyles.position);
    expect(parseInt(sidebarStyles.zIndex)).toBeGreaterThan(0);
  });
});
