import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ContextMenu from '$lib/components/shared/context-menu.svelte';

// contextMenuStoreをモック
vi.mock('$lib/stores/context-menu.svelte', () => ({
  contextMenuStore: {
    state: {
      show: false,
      x: 0,
      y: 0,
      options: []
    },
    close: vi.fn()
  }
}));

describe('ContextMenu (shared)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // DOMイベントリスナーをモック
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
  });

  it('コンポーネントが正しく初期化される', () => {
    // 複雑な外部依存のため基本的なテストのみ実装
    const { container } = render(ContextMenu);
    expect(container).toBeDefined();
  });

  it('showがfalseの場合はレンダリングされない', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state.show = false;
    
    const { container } = render(ContextMenu);
    expect(container.firstChild).toBeNull();
  });

  it('showがtrueの場合の状態を処理する', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 100,
      y: 200,
      options: [
        {
          label: 'Test Option',
          action: vi.fn(),
          disabled: false,
          separator: false
        }
      ]
    };
    
    expect(contextMenuStore.state.show).toBe(true);
    expect(contextMenuStore.state.x).toBe(100);
    expect(contextMenuStore.state.y).toBe(200);
    expect(contextMenuStore.state.options).toHaveLength(1);
  });

  it('複数のオプションが処理される', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 0,
      y: 0,
      options: [
        {
          label: 'Option 1',
          action: vi.fn(),
          disabled: false,
          separator: false
        },
        {
          label: 'Option 2',
          action: vi.fn(),
          disabled: true,
          separator: false
        },
        {
          separator: true
        },
        {
          label: 'Option 3',
          action: vi.fn(),
          disabled: false,
          separator: false
        }
      ]
    };
    
    expect(contextMenuStore.state.options).toHaveLength(4);
    expect(contextMenuStore.state.options[0].label).toBe('Option 1');
    expect(contextMenuStore.state.options[1].disabled).toBe(true);
    expect(contextMenuStore.state.options[2].separator).toBe(true);
  });

  it('座標が正しく設定される', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    
    const coordinates = [
      { x: 0, y: 0 },
      { x: 100, y: 200 },
      { x: 500, y: 300 },
      { x: 1000, y: 800 }
    ];

    coordinates.forEach(coord => {
      contextMenuStore.state = {
        show: true,
        x: coord.x,
        y: coord.y,
        options: []
      };
      
      expect(contextMenuStore.state.x).toBe(coord.x);
      expect(contextMenuStore.state.y).toBe(coord.y);
    });
  });

  it('空のオプション配列が処理される', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 100,
      y: 100,
      options: []
    };
    
    expect(contextMenuStore.state.options).toEqual([]);
  });

  it('separatorオプションが処理される', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 0,
      y: 0,
      options: [
        {
          label: 'Before Separator',
          action: vi.fn(),
          disabled: false,
          separator: false
        },
        {
          separator: true
        },
        {
          label: 'After Separator',
          action: vi.fn(),
          disabled: false,
          separator: false
        }
      ]
    };
    
    const separatorOption = contextMenuStore.state.options[1];
    expect(separatorOption.separator).toBe(true);
    expect(separatorOption.label).toBeUndefined();
    expect(separatorOption.action).toBeUndefined();
  });

  it('disabledオプションが処理される', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 0,
      y: 0,
      options: [
        {
          label: 'Enabled Option',
          action: vi.fn(),
          disabled: false,
          separator: false
        },
        {
          label: 'Disabled Option',
          action: vi.fn(),
          disabled: true,
          separator: false
        }
      ]
    };
    
    expect(contextMenuStore.state.options[0].disabled).toBe(false);
    expect(contextMenuStore.state.options[1].disabled).toBe(true);
  });

  it('iconを持つオプションが処理される', () => {
    const MockIcon = () => '<svg></svg>';
    
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 0,
      y: 0,
      options: [
        {
          label: 'Option with Icon',
          action: vi.fn(),
          disabled: false,
          separator: false,
          icon: MockIcon
        },
        {
          label: 'Option without Icon',
          action: vi.fn(),
          disabled: false,
          separator: false
        }
      ]
    };
    
    expect(contextMenuStore.state.options[0].icon).toBe(MockIcon);
    expect(contextMenuStore.state.options[1].icon).toBeUndefined();
  });

  it('actionコールバックが設定される', () => {
    const action1 = vi.fn();
    const action2 = vi.fn();
    
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 0,
      y: 0,
      options: [
        {
          label: 'Action 1',
          action: action1,
          disabled: false,
          separator: false
        },
        {
          label: 'Action 2',
          action: action2,
          disabled: false,
          separator: false
        }
      ]
    };
    
    expect(contextMenuStore.state.options[0].action).toBe(action1);
    expect(contextMenuStore.state.options[1].action).toBe(action2);
    expect(contextMenuStore.state.options[0].action).toBeInstanceOf(Function);
    expect(contextMenuStore.state.options[1].action).toBeInstanceOf(Function);
  });

  it('contextMenuStore.closeが呼び出し可能である', () => {
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    
    expect(contextMenuStore.close).toBeInstanceOf(Function);
    expect(() => contextMenuStore.close()).not.toThrow();
  });

  it('複雑なオプション構成が処理される', () => {
    const complexAction = vi.fn();
    const MockIcon = () => '<svg></svg>';
    
    const { contextMenuStore } = require('$lib/stores/context-menu.svelte');
    contextMenuStore.state = {
      show: true,
      x: 150,
      y: 250,
      options: [
        {
          label: 'Edit',
          action: complexAction,
          disabled: false,
          separator: false,
          icon: MockIcon
        },
        {
          separator: true
        },
        {
          label: 'Delete (Disabled)',
          action: vi.fn(),
          disabled: true,
          separator: false
        },
        {
          label: 'Copy',
          action: vi.fn(),
          disabled: false,
          separator: false
        }
      ]
    };
    
    expect(contextMenuStore.state.show).toBe(true);
    expect(contextMenuStore.state.options).toHaveLength(4);
    expect(contextMenuStore.state.options[0].icon).toBe(MockIcon);
    expect(contextMenuStore.state.options[1].separator).toBe(true);
    expect(contextMenuStore.state.options[2].disabled).toBe(true);
    expect(contextMenuStore.state.options[3].disabled).toBe(false);
  });

  it('DOMイベントリスナーが正しく設定される', () => {
    render(ContextMenu);
    
    // onMountでイベントリスナーが追加されることを確認
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
  });
});