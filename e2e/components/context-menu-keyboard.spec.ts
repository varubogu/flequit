import { test, expect } from '@playwright/test';

test.describe('Context Menu キーボード操作', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のページに移動（context-menuを含むページ）
    await page.goto('/');
  });

  test('context-menuでキーボード操作ができる', async ({ page }) => {
    // タスクアイテムを右クリックしてcontext-menuを開く
    const taskItem = page.getByTestId('task-item').first();
    await taskItem.click({ button: 'right' });

    // メニューが表示されることを確認
    const contextMenu = page.getByRole('menu');
    await expect(contextMenu).toBeVisible();

    // ArrowDownキーで項目を選択
    await page.keyboard.press('ArrowDown');
    
    // 最初のメニューアイテムがハイライトされることを確認
    const firstMenuItem = page.getByRole('menuitem').first();
    await expect(firstMenuItem).toHaveClass(/bg-accent/);

    // さらにArrowDownキーを press
    await page.keyboard.press('ArrowDown');
    
    // 2番目のメニューアイテムがハイライトされることを確認
    const secondMenuItem = page.getByRole('menuitem').nth(1);
    await expect(secondMenuItem).toHaveClass(/bg-accent/);

    // ArrowUpキーで前の項目に戻る
    await page.keyboard.press('ArrowUp');
    
    // 最初のメニューアイテムが再びハイライトされることを確認
    await expect(firstMenuItem).toHaveClass(/bg-accent/);

    // Escapeキーでメニューを閉じる
    await page.keyboard.press('Escape');
    
    // メニューが非表示になることを確認
    await expect(contextMenu).not.toBeVisible();
  });

  test('マウスホバーでメニュー項目がハイライトされる', async ({ page }) => {
    // タスクアイテムを右クリックしてcontext-menuを開く
    const taskItem = page.getByTestId('task-item').first();
    await taskItem.click({ button: 'right' });

    // メニューが表示されることを確認
    const contextMenu = page.getByRole('menu');
    await expect(contextMenu).toBeVisible();

    // 2番目のメニューアイテムにマウスを合わせる
    const secondMenuItem = page.getByRole('menuitem').nth(1);
    await secondMenuItem.hover();
    
    // 2番目のメニューアイテムがハイライトされることを確認
    await expect(secondMenuItem).toHaveClass(/bg-accent/);

    // 3番目のメニューアイテムにマウスを合わせる
    const thirdMenuItem = page.getByRole('menuitem').nth(2);
    await thirdMenuItem.hover();
    
    // 3番目のメニューアイテムがハイライトされることを確認
    await expect(thirdMenuItem).toHaveClass(/bg-accent/);
  });

  test('Enterキーで選択されたメニューアイテムが実行される', async ({ page }) => {
    // タスクアイテムを右クリックしてcontext-menuを開く
    const taskItem = page.getByTestId('task-item').first();
    await taskItem.click({ button: 'right' });

    // メニューが表示されることを確認
    const contextMenu = page.getByRole('menu');
    await expect(contextMenu).toBeVisible();

    // ArrowDownキーで項目を選択
    await page.keyboard.press('ArrowDown');
    
    // Enterキーでアクションを実行
    await page.keyboard.press('Enter');
    
    // メニューが閉じられることを確認
    await expect(contextMenu).not.toBeVisible();
    
    // アクションが実行されたことを確認（例：編集モードに入る）
    // 実際のアクションは実装に応じて調整する
  });
});