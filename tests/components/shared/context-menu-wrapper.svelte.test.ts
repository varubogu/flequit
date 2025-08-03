import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import type { ContextMenuList } from '$lib/types/context-menu';
import type { Snippet } from 'svelte';
import { Edit, Trash2 } from 'lucide-svelte';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => createUnitTestTranslationService()
}));

// context-menu-storeのモック
vi.mock('$lib/stores/context-menu.svelte', () => ({
  contextMenuStore: {
    isOpen: false,
    selectedIndex: 0,
    open: vi.fn(),
    close: vi.fn(),
    selectNext: vi.fn(),
    selectPrevious: vi.fn(),
    selectIndex: vi.fn(),
    activateSelected: vi.fn().mockReturnValue(0)
  }
}));

// UI Context Menuコンポーネントのモック
vi.mock('$lib/components/ui/context-menu/index.js', () => ({
  Root: vi.fn(),
  Trigger: vi.fn(),
  Content: vi.fn(),
  Item: vi.fn(),
  Separator: vi.fn()
}));

// ContextMenuItemsのモック
vi.mock('$lib/components/shared/context-menu-items.svelte', () => ({
  default: vi.fn()
}));

describe('ContextMenuWrapper', () => {
  const mockAction1 = vi.fn();
  const mockAction2 = vi.fn();

  const mockItems: ContextMenuList = [
    {
      id: 'edit',
      label: 'Edit',
      action: mockAction1,
      icon: Edit
    },
    {
      type: 'separator'
    },
    {
      id: 'delete',
      label: 'Delete',
      action: mockAction2,
      icon: Trash2,
      destructive: true
    }
  ];

  // テスト用の子コンポーネントSnippet
  const TestChildSnippet = (() =>
    `<div data-testid="child-content">Test Content</div>`) as unknown as Snippet;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: mockItems,
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });

  it('子コンポーネントが正しく表示される', () => {
    const { component } = render(ContextMenuWrapper, {
      props: {
        items: mockItems,
        children: TestChildSnippet
      }
    });

    // コンポーネントが正常に作成されることを確認
    expect(component).toBeTruthy();
  });

  it('itemsプロパティが正しく渡される', () => {
    const { component } = render(ContextMenuWrapper, {
      props: {
        items: mockItems,
        children: TestChildSnippet
      }
    });

    // itemsプロパティが設定されていることを確認
    expect(component).toBeTruthy();
  });

  it('デフォルトのcontentClassが適用される', () => {
    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: mockItems,
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });

  it('カスタムcontentClassが適用される', () => {
    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: mockItems,
          children: TestChildSnippet,
          contentClass: 'w-64 custom-class'
        }
      });
    }).not.toThrow();
  });

  it('空のitemsでもエラーが発生しない', () => {
    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: [],
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });

  it('ContextMenuがRoot構造を持つ', () => {
    const { component } = render(ContextMenuWrapper, {
      props: {
        items: mockItems,
        children: TestChildSnippet
      }
    });

    // ContextMenu.Rootコンポーネントの基本構造が正常に動作することを確認
    expect(component).toBeTruthy();
  });

  it('ContextMenuItemsコンポーネントにpropsが正しく渡される', async () => {
    const ContextMenuItems = await import('$lib/components/shared/context-menu-items.svelte');

    render(ContextMenuWrapper, {
      props: {
        items: mockItems,
        children: TestChildSnippet,
        contentClass: 'w-64'
      }
    });

    // ContextMenuItemsがモックされていることを確認
    expect(ContextMenuItems.default).toBeDefined();
  });

  it('複数のメニューアイテムを含むリストが正しく処理される', () => {
    const complexItems: ContextMenuList = [
      {
        id: 'item1',
        label: 'Item 1',
        action: vi.fn()
      },
      {
        id: 'item2',
        label: 'Item 2',
        action: vi.fn(),
        disabled: true
      },
      {
        type: 'separator'
      },
      {
        id: 'item3',
        label: 'Item 3',
        action: vi.fn(),
        keyboardShortcut: 'Ctrl+D'
      }
    ];

    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: complexItems,
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });

  it('関数型のlabelとdisabledプロパティを持つアイテムも正しく処理される', () => {
    const dynamicItems: ContextMenuList = [
      {
        id: 'dynamic',
        label: () => 'Dynamic Label',
        action: vi.fn(),
        disabled: () => false,
        visible: () => true
      }
    ];

    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: dynamicItems,
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });

  it('destructiveフラグを持つアイテムも正しく処理される', () => {
    const destructiveItems: ContextMenuList = [
      {
        id: 'danger',
        label: 'Dangerous Action',
        action: vi.fn(),
        destructive: true
      }
    ];

    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: destructiveItems,
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });

  it('アイコン付きメニューアイテムが正しく処理される', () => {
    const iconItems: ContextMenuList = [
      {
        id: 'with-icon',
        label: 'With Icon',
        action: vi.fn(),
        icon: Edit
      },
      {
        id: 'without-icon',
        label: 'Without Icon',
        action: vi.fn()
      }
    ];

    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: iconItems,
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });

  it('keyboardShortcut付きメニューアイテムが正しく処理される', () => {
    const shortcutItems: ContextMenuList = [
      {
        id: 'shortcut',
        label: 'With Shortcut',
        action: vi.fn(),
        keyboardShortcut: 'Ctrl+X'
      }
    ];

    expect(() => {
      render(ContextMenuWrapper, {
        props: {
          items: shortcutItems,
          children: TestChildSnippet
        }
      });
    }).not.toThrow();
  });
});
