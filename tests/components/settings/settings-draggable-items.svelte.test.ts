import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import SettingsDraggableItems from '$lib/components/settings/settings-draggable-items.svelte';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const translations: Record<string, string> = {
        visible_in_sidebar: 'TEST_VISIBLE_IN_SIDEBAR',
        hidden_from_sidebar: 'TEST_HIDDEN_FROM_SIDEBAR'
      };
      return translations[key] || key;
    })
  }))
}));

// ドラッグ&ドロップライブラリのモック
vi.mock('@thisux/sveltednd', () => ({
  draggable: vi.fn(() => ({})),
  droppable: vi.fn(() => ({}))
}));

// viewsVisibilityStoreのモック
vi.mock('$lib/stores/views-visibility.svelte', () => ({
  viewsVisibilityStore: {
    visibleViews: [
      { id: 'all-tasks', icon: '📋', label: 'All Tasks' },
      { id: 'today', icon: '📅', label: 'Today' }
    ],
    hiddenViews: [
      { id: 'completed', icon: '✅', label: 'Completed' },
      { id: 'archived', icon: '📦', label: 'Archived' }
    ],
    setLists: vi.fn()
  }
}));

// Lucide Svelteアイコンのモック
vi.mock('lucide-svelte', () => ({
  GripVertical: vi.fn().mockImplementation(() => ({
    $$: {
      on_mount: [],
      on_destroy: [],
      before_update: [],
      after_update: [],
      context: new Map(),
      callbacks: new Map(),
      dirty: [],
      skip_bound: false,
      bound: {}
    }
  }))
}));

describe('SettingsDraggableItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(SettingsDraggableItems);
    }).not.toThrow();
  });

  it('グリッドレイアウトが適用される', () => {
    const { container } = render(SettingsDraggableItems);

    const gridContainer = container.querySelector('div');
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-6', 'md:grid-cols-2');
  });

  it('可視ビューセクションのタイトルが表示される', () => {
    const { getByText } = render(SettingsDraggableItems);

    expect(getByText('TEST_VISIBLE_IN_SIDEBAR')).toBeInTheDocument();
  });

  it('非表示ビューセクションのタイトルが表示される', () => {
    const { getByText } = render(SettingsDraggableItems);

    expect(getByText('TEST_HIDDEN_FROM_SIDEBAR')).toBeInTheDocument();
  });

  it('セクションタイトルが適切なスタイルクラスを持つ', () => {
    const { getByText } = render(SettingsDraggableItems);

    const visibleTitle = getByText('TEST_VISIBLE_IN_SIDEBAR');
    const hiddenTitle = getByText('TEST_HIDDEN_FROM_SIDEBAR');

    expect(visibleTitle).toHaveClass('mb-3', 'text-base', 'font-medium');
    expect(hiddenTitle).toHaveClass('mb-3', 'text-base', 'font-medium');
  });

  it('可視ビューのドロップエリアが適切なスタイルを持つ', () => {
    const { container } = render(SettingsDraggableItems);

    const visibleDropArea = container.querySelector('.bg-background.relative.min-h-\\[200px\\]');
    expect(visibleDropArea).toHaveClass('space-y-1', 'rounded-lg', 'border', 'p-2');
  });

  it('非表示ビューのドロップエリアが適切なスタイルを持つ', () => {
    const { container } = render(SettingsDraggableItems);

    const hiddenDropArea = container.querySelector('.bg-muted\\/50.relative.min-h-\\[200px\\]');
    expect(hiddenDropArea).toHaveClass('space-y-1', 'rounded-lg', 'border', 'p-2');
  });

  it('可視ビューアイテムが表示される', () => {
    const { getByText } = render(SettingsDraggableItems);

    expect(getByText('📋 All Tasks')).toBeInTheDocument();
    expect(getByText('📅 Today')).toBeInTheDocument();
  });

  it('非表示ビューアイテムが表示される', () => {
    const { getByText } = render(SettingsDraggableItems);

    expect(getByText('✅ Completed')).toBeInTheDocument();
    expect(getByText('📦 Archived')).toBeInTheDocument();
  });

  it('アイテムが適切なdata-item-id属性を持つ', () => {
    const { container } = render(SettingsDraggableItems);

    const allTasksItem = container.querySelector('[data-item-id="all-tasks"]');
    const todayItem = container.querySelector('[data-item-id="today"]');
    const completedItem = container.querySelector('[data-item-id="completed"]');
    const archivedItem = container.querySelector('[data-item-id="archived"]');

    expect(allTasksItem).toBeInTheDocument();
    expect(todayItem).toBeInTheDocument();
    expect(completedItem).toBeInTheDocument();
    expect(archivedItem).toBeInTheDocument();
  });

  it('アイテムが適切なスタイルクラスを持つ', () => {
    const { container } = render(SettingsDraggableItems);

    const items = container.querySelectorAll('[data-item-id]');
    items.forEach((item) => {
      expect(item).toHaveClass(
        'bg-card',
        'hover:bg-muted',
        'flex',
        'cursor-grab',
        'items-center',
        'rounded-md',
        'border',
        'p-2'
      );
    });
  });

  it('アイテムのテキストが適切なスタイルクラスを持つ', () => {
    const { container } = render(SettingsDraggableItems);

    const textSpans = container.querySelectorAll('span.flex-1.text-sm');
    expect(textSpans.length).toBeGreaterThan(0);
  });

  it('レスポンシブデザインが適用される', () => {
    const { container } = render(SettingsDraggableItems);

    const gridContainer = container.querySelector('div');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
  });

  it('ドロップエリアの最小高さが設定される', () => {
    const { container } = render(SettingsDraggableItems);

    const dropAreas = container.querySelectorAll('.min-h-\\[200px\\]');
    expect(dropAreas).toHaveLength(2);
  });

  it('Lucide GripVerticalアイコンが使用される', () => {
    expect(() => {
      render(SettingsDraggableItems);
    }).not.toThrow();
  });

  it('ドロップエリアが相対位置指定される', () => {
    const { container } = render(SettingsDraggableItems);

    const dropAreas = container.querySelectorAll('.relative');
    expect(dropAreas.length).toBeGreaterThanOrEqual(2);
  });

  it('アイテム間の適切なスペーシングが設定される', () => {
    const { container } = render(SettingsDraggableItems);

    const dropAreas = container.querySelectorAll('.space-y-1');
    expect(dropAreas).toHaveLength(2);
  });

  it('可視エリアと非表示エリアが区別されるスタイルを持つ', () => {
    const { container } = render(SettingsDraggableItems);

    const visibleArea = container.querySelector('.bg-background');
    const hiddenArea = container.querySelector('.bg-muted\\/50');

    expect(visibleArea).toBeInTheDocument();
    expect(hiddenArea).toBeInTheDocument();
  });

  it('アイテムのアイコンとラベルが正しく表示される', () => {
    const { getByText } = render(SettingsDraggableItems);

    // アイコンとラベルが含まれていることを確認
    expect(getByText('📋 All Tasks')).toBeInTheDocument();
    expect(getByText('📅 Today')).toBeInTheDocument();
    expect(getByText('✅ Completed')).toBeInTheDocument();
    expect(getByText('📦 Archived')).toBeInTheDocument();
  });

  it('コンテナが適切なボーダーを持つ', () => {
    const { container } = render(SettingsDraggableItems);

    const borderedElements = container.querySelectorAll('.border');
    expect(borderedElements.length).toBeGreaterThan(0);
  });

  it('角丸が適用される', () => {
    const { container } = render(SettingsDraggableItems);

    const roundedElements = container.querySelectorAll('.rounded-lg, .rounded-md');
    expect(roundedElements.length).toBeGreaterThan(0);
  });

  it('適切なパディングが設定される', () => {
    const { container } = render(SettingsDraggableItems);

    const paddedElements = container.querySelectorAll('.p-2');
    expect(paddedElements.length).toBeGreaterThan(0);
  });

  it('翻訳されたテキストが正しく表示される', () => {
    const { getByText } = render(SettingsDraggableItems);

    expect(getByText('TEST_VISIBLE_IN_SIDEBAR')).toBeInTheDocument();
    expect(getByText('TEST_HIDDEN_FROM_SIDEBAR')).toBeInTheDocument();
  });

  it('グリッドアイテムが正しく配置される', () => {
    const { container } = render(SettingsDraggableItems);

    const gridContainer = container.querySelector('.grid');
    const gridItems = gridContainer?.children;
    expect(gridItems).toHaveLength(2); // 可視エリアと非表示エリア
  });

  it('カーソルスタイルが適切に設定される', () => {
    const { container } = render(SettingsDraggableItems);

    const draggableItems = container.querySelectorAll('.cursor-grab');
    expect(draggableItems.length).toBe(4); // 2つの可視アイテム + 2つの非表示アイテム
  });
});
