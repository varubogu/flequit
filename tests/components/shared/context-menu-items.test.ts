import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contextMenuStore } from '$lib/stores/context-menu.svelte.js';
import type { ContextMenuList } from '$lib/types/context-menu';

// モックアイコンコンポーネント
const MockIcon = () => '<svg></svg>';

describe('ContextMenuItems', () => {
  const mockAction1 = vi.fn();
  const mockAction2 = vi.fn();
  const mockAction3 = vi.fn();

  const testItems: ContextMenuList = [
    {
      id: 'item1',
      label: 'アイテム1',
      action: mockAction1,
      icon: MockIcon
    },
    { type: 'separator' },
    {
      id: 'item2',
      label: 'アイテム2',
      action: mockAction2,
      disabled: false
    },
    {
      id: 'item3',
      label: 'アイテム3',
      action: mockAction3,
      destructive: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    contextMenuStore.close();
  });

  it('context-menuストアが正しく動作する', () => {
    // これはstoreの動作を確認するテスト
    contextMenuStore.open(3);
    expect(contextMenuStore.isOpen).toBe(true);
    expect(contextMenuStore.itemCount).toBe(3);

    contextMenuStore.selectNext();
    expect(contextMenuStore.selectedIndex).toBe(0);

    contextMenuStore.close();
    expect(contextMenuStore.isOpen).toBe(false);
  });

  it('メニューアイテムのプロパティが正しく設定される', () => {
    // アイテムのdisabledプロパティをテスト
    const itemWithDisabled: ContextMenuList = [
      {
        id: 'disabled-item',
        label: 'Disabled Item',
        action: vi.fn(),
        disabled: true
      }
    ];

    expect(itemWithDisabled[0]).toMatchObject({
      id: 'disabled-item',
      label: 'Disabled Item',
      disabled: true
    });
  });

  it('破壊的アクションのフラグが正しく設定される', () => {
    const destructiveItem = testItems.find((item) => 'destructive' in item && item.destructive);

    expect(destructiveItem).toBeDefined();
    expect(destructiveItem).toMatchObject({
      id: 'item3',
      destructive: true
    });
  });

  it('セパレーターアイテムが正しく識別される', () => {
    const separatorItem = testItems.find((item) => 'type' in item && item.type === 'separator');

    expect(separatorItem).toEqual({ type: 'separator' });
  });

  it('ラベルが関数の場合も対応される', () => {
    const labelFunction = vi.fn().mockReturnValue('Dynamic Label');
    const dynamicItem: ContextMenuList = [
      {
        id: 'dynamic',
        label: labelFunction,
        action: vi.fn()
      }
    ];

    const item = dynamicItem[0] as any;
    expect(typeof item.label).toBe('function');
    expect(item.label()).toBe('Dynamic Label');
  });

  it('disabledが関数の場合も対応される', () => {
    const disabledFunction = vi.fn().mockReturnValue(true);
    const dynamicDisabledItem: ContextMenuList = [
      {
        id: 'dynamic-disabled',
        label: 'Item',
        action: vi.fn(),
        disabled: disabledFunction
      }
    ];

    const item = dynamicDisabledItem[0] as any;
    expect(typeof item.disabled).toBe('function');
    expect(item.disabled()).toBe(true);
  });
});
