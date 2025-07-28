import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contextMenuStore } from '$lib/stores/context-menu.svelte.js';

describe('ContextMenu結合テスト - キーボード操作', () => {
  beforeEach(() => {
    contextMenuStore.close();
    vi.clearAllMocks();
  });

  it('メニューが開かれると正常にキーボード操作できる', () => {
    // 3つのアイテムでメニューを開く
    contextMenuStore.open(3);
    
    expect(contextMenuStore.isOpen).toBe(true);
    expect(contextMenuStore.selectedIndex).toBe(-1);
    expect(contextMenuStore.itemCount).toBe(3);
  });

  it('ArrowDownキーで順次選択が移動する', () => {
    contextMenuStore.open(3);
    
    // 初期状態から1つ目を選択
    contextMenuStore.selectNext();
    expect(contextMenuStore.selectedIndex).toBe(0);
    
    // 2つ目を選択
    contextMenuStore.selectNext();
    expect(contextMenuStore.selectedIndex).toBe(1);
    
    // 3つ目を選択
    contextMenuStore.selectNext();
    expect(contextMenuStore.selectedIndex).toBe(2);
    
    // 最後から先頭にループ
    contextMenuStore.selectNext();
    expect(contextMenuStore.selectedIndex).toBe(0);
  });

  it('ArrowUpキーで逆順に選択が移動する', () => {
    contextMenuStore.open(3);
    
    // 初期状態から最後の項目を選択
    contextMenuStore.selectPrevious();
    expect(contextMenuStore.selectedIndex).toBe(2);
    
    // 2つ目を選択
    contextMenuStore.selectPrevious();
    expect(contextMenuStore.selectedIndex).toBe(1);
    
    // 1つ目を選択
    contextMenuStore.selectPrevious();
    expect(contextMenuStore.selectedIndex).toBe(0);
    
    // 先頭から最後にループ
    contextMenuStore.selectPrevious();
    expect(contextMenuStore.selectedIndex).toBe(2);
  });

  it('マウスホバーで選択状態が変更される', () => {
    contextMenuStore.open(3);
    
    // 2番目の項目にホバー
    contextMenuStore.selectIndex(1);
    expect(contextMenuStore.selectedIndex).toBe(1);
    
    // 1番目の項目にホバー
    contextMenuStore.selectIndex(0);
    expect(contextMenuStore.selectedIndex).toBe(0);
    
    // 3番目の項目にホバー
    contextMenuStore.selectIndex(2);
    expect(contextMenuStore.selectedIndex).toBe(2);
  });

  it('Enterキーで選択されたアイテムを取得できる', () => {
    contextMenuStore.open(3);
    
    // 何も選択されていない場合はnull
    expect(contextMenuStore.activateSelected()).toBe(null);
    
    // 1番目のアイテムを選択してアクティブ化
    contextMenuStore.selectIndex(0);
    expect(contextMenuStore.activateSelected()).toBe(0);
    
    // 2番目のアイテムを選択してアクティブ化
    contextMenuStore.selectIndex(1);
    expect(contextMenuStore.activateSelected()).toBe(1);
  });

  it('Escapeキーでメニューが閉じられる', () => {
    contextMenuStore.open(3);
    contextMenuStore.selectIndex(1);
    
    expect(contextMenuStore.isOpen).toBe(true);
    expect(contextMenuStore.selectedIndex).toBe(1);
    
    // メニューを閉じる
    contextMenuStore.close();
    
    expect(contextMenuStore.isOpen).toBe(false);
    expect(contextMenuStore.selectedIndex).toBe(-1);
    expect(contextMenuStore.itemCount).toBe(0);
  });

  it('範囲外インデックスの操作は無視される', () => {
    contextMenuStore.open(3);
    
    // 負のインデックス
    contextMenuStore.selectIndex(-1);
    expect(contextMenuStore.selectedIndex).toBe(-1);
    
    // 範囲外のインデックス
    contextMenuStore.selectIndex(3);
    expect(contextMenuStore.selectedIndex).toBe(-1);
    
    contextMenuStore.selectIndex(10);
    expect(contextMenuStore.selectedIndex).toBe(-1);
  });

  it('メニューが閉じている時の操作は無視される', () => {
    // メニューが閉じている状態
    expect(contextMenuStore.isOpen).toBe(false);
    
    // 各操作を試す
    contextMenuStore.selectNext();
    expect(contextMenuStore.selectedIndex).toBe(-1);
    
    contextMenuStore.selectPrevious();
    expect(contextMenuStore.selectedIndex).toBe(-1);
    
    contextMenuStore.selectIndex(1);
    expect(contextMenuStore.selectedIndex).toBe(-1);
    
    expect(contextMenuStore.activateSelected()).toBe(null);
  });
});