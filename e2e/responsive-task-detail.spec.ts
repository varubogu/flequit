import { test, expect } from '@playwright/test';

test.describe('Responsive Task Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('デスクトップ表示でリサイズ可能なパネル構成が表示される', async ({ page }) => {
    // デスクトップビューポートに設定
    await page.setViewportSize({ width: 1024, height: 768 });

    // リサイズハンドルが表示されることを確認
    const resizeHandle = page.locator('[data-pane-resizer]');
    await expect(resizeHandle).toBeVisible();

    // タスクリストとタスク詳細の両パネルが表示される
    const taskList = page.getByTestId('task-list');
    await expect(taskList).toBeVisible();

    // タスク詳細パネルも表示される（内容は空でも構造として存在）
    const taskDetailPane = page.locator('[data-pane]').nth(1);
    await expect(taskDetailPane).toBeVisible();
  });

  test('モバイル表示でタスクリストのみが表示される', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // タスクリストは表示される
    const taskList = page.getByTestId('task-list');
    await expect(taskList).toBeVisible();

    // リサイズハンドルは表示されない
    const resizeHandle = page.locator('[data-pane-resizer]');
    await expect(resizeHandle).not.toBeVisible();

    // タスク詳細Drawerは初期状態では非表示
    const drawer = page.locator('[data-vaul-drawer]');
    await expect(drawer).not.toBeVisible();
  });

  test('モバイルでタスククリック時にDrawerが開く', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // サンプルタスクが存在する場合のテスト
    const firstTask = page.locator('[data-testid^="task-"]').first();

    if (await firstTask.isVisible()) {
      // タスクをクリック
      await firstTask.click();

      // Drawerが表示されることを確認
      const drawer = page.locator('[data-vaul-drawer]');
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Drawerのタイトルが表示される
      const drawerTitle = page.getByText('タスク詳細');
      await expect(drawerTitle).toBeVisible();

      // 閉じるボタンをクリック
      const closeButton = page.getByText('閉じる');
      await closeButton.click();

      // Drawerが閉じることを確認
      await expect(drawer).not.toBeVisible({ timeout: 5000 });
    } else {
      // タスクがない場合はスキップ
      test.skip(true, 'No tasks available for testing');
    }
  });

  test('画面サイズ変更時にレスポンシブ表示が切り替わる', async ({ page }) => {
    // デスクトップサイズから開始
    await page.setViewportSize({ width: 1024, height: 768 });

    // デスクトップ表示を確認
    let resizeHandle = page.locator('[data-pane-resizer]');
    await expect(resizeHandle).toBeVisible();

    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // モバイル表示に切り替わることを確認
    await expect(resizeHandle).not.toBeVisible();

    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1024, height: 768 });

    // デスクトップ表示に戻ることを確認
    resizeHandle = page.locator('[data-pane-resizer]');
    await expect(resizeHandle).toBeVisible();
  });

  test('モバイル時のサイドバートグルボタンが正しく動作する', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // モバイル用サイドバートグルボタンをクリック
    const toggleButton = page.getByTestId('mobile-sidebar-toggle');
    await expect(toggleButton).toBeVisible();

    await toggleButton.click();

    // サイドバーが表示される
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();

    // サイドバーを閉じる（オーバーレイクリックまたは別の方法）
    await page.mouse.click(100, 100); // 画面の別の場所をクリック

    // サイドバーが閉じることを確認
    await expect(sidebar).not.toBeVisible({ timeout: 5000 });
  });
});
