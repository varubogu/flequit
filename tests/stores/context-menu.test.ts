import { describe, it, expect, beforeEach } from 'vitest';
import { ContextMenuStore } from '$lib/stores/context-menu.svelte.js';

describe('ContextMenuStore', () => {
  let store: ContextMenuStore;

  beforeEach(() => {
    store = new ContextMenuStore();
  });

  it('初期状態では閉じていて何も選択されていない', () => {
    expect(store.isOpen).toBe(false);
    expect(store.selectedIndex).toBe(-1);
    expect(store.itemCount).toBe(0);
  });

  it('openメソッドでメニューが開かれる', () => {
    store.open(3);
    
    expect(store.isOpen).toBe(true);
    expect(store.itemCount).toBe(3);
    expect(store.selectedIndex).toBe(-1);
  });

  it('closeメソッドでメニューが閉じられる', () => {
    store.open(3);
    store.close();
    
    expect(store.isOpen).toBe(false);
    expect(store.selectedIndex).toBe(-1);
    expect(store.itemCount).toBe(0);
  });

  it('selectNextで次の項目を選択する', () => {
    store.open(3);
    
    store.selectNext();
    expect(store.selectedIndex).toBe(0);
    
    store.selectNext();
    expect(store.selectedIndex).toBe(1);
    
    store.selectNext();
    expect(store.selectedIndex).toBe(2);
    
    // 最後の項目で次を選択すると最初に戻る
    store.selectNext();
    expect(store.selectedIndex).toBe(0);
  });

  it('selectPreviousで前の項目を選択する', () => {
    store.open(3);
    
    // 初期状態(-1)から前を選択すると最後の項目に移動
    store.selectPrevious();
    expect(store.selectedIndex).toBe(2);
    
    store.selectPrevious();
    expect(store.selectedIndex).toBe(1);
    
    store.selectPrevious();
    expect(store.selectedIndex).toBe(0);
    
    // 最初の項目で前を選択すると最後に移動
    store.selectPrevious();
    expect(store.selectedIndex).toBe(2);
  });

  it('selectIndexで特定のインデックスを選択する', () => {
    store.open(3);
    
    store.selectIndex(1);
    expect(store.selectedIndex).toBe(1);
    
    store.selectIndex(2);
    expect(store.selectedIndex).toBe(2);
  });

  it('範囲外のインデックスは選択されない', () => {
    store.open(3);
    
    store.selectIndex(-1);
    expect(store.selectedIndex).toBe(-1);
    
    store.selectIndex(3);
    expect(store.selectedIndex).toBe(-1);
  });

  it('メニューが閉じているときは操作が効かない', () => {
    store.selectNext();
    expect(store.selectedIndex).toBe(-1);
    
    store.selectPrevious();
    expect(store.selectedIndex).toBe(-1);
    
    store.selectIndex(1);
    expect(store.selectedIndex).toBe(-1);
  });

  it('activateSelectedで現在選択されているインデックスを取得する', () => {
    store.open(3);
    
    // 何も選択されていない場合はnull
    expect(store.activateSelected()).toBe(null);
    
    store.selectIndex(1);
    expect(store.activateSelected()).toBe(1);
  });

  it('メニューが閉じているときactivateSelectedはnullを返す', () => {
    expect(store.activateSelected()).toBe(null);
  });
});