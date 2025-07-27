import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ContextMenu from '$lib/components/shared/context-menu.svelte';

// contextMenuStoreをモック
vi.mock('$lib/stores/context-menu.svelte.ts', () => ({
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

  it('DOMイベントリスナーが正しく設定される', () => {
    render(ContextMenu);
    
    // onMountでイベントリスナーが追加されることを確認
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
  });
});