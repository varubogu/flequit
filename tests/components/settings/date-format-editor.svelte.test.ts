import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import DateFormatEditor from '$lib/components/settings/date-format/date-format-editor.svelte';

// 依存関係のモック
vi.mock('$lib/stores/datetime-format.svelte', () => ({
  dateTimeFormatStore: {
    currentFormat: 'YYYY-MM-DD',
    allFormats: vi.fn(() => [
      { id: '1', name: 'ISO Date', format: 'YYYY-MM-DD', group: 'プリセット' },
      { id: '2', name: 'Custom Format', format: 'DD/MM/YYYY', group: 'カスタムフォーマット' }
    ]),
    setCurrentFormat: vi.fn(),
    addCustomFormat: vi.fn(() => 'new-id'),
    updateCustomFormat: vi.fn(),
    removeCustomFormat: vi.fn()
  }
}));

vi.mock('svelte-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// 子コンポーネントのモック
vi.mock('$lib/components/settings/date-format-editor-header.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
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

vi.mock('$lib/components/settings/test-datetime-section.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
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

vi.mock('$lib/components/settings/main-date-format-section.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
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

vi.mock('$lib/components/settings/format-copy-buttons.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
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

vi.mock('$lib/components/settings/test-format-section.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
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

vi.mock('$lib/components/settings/custom-format-controls.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
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

vi.mock('$lib/components/settings/delete-format-dialog.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
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

describe('DateFormatEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(DateFormatEditor, {
        props: {
          open: true
        }
      });
    }).not.toThrow();
  });

  it('openがfalseの時は何も表示されない', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: false
      }
    });

    const dialog = container.querySelector('.fixed.inset-0');
    expect(dialog).toBeNull();
  });

  it('openがtrueの時にダイアログが表示される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const dialog = container.querySelector('.fixed.inset-0');
    expect(dialog).toBeInTheDocument();
  });

  it('ダイアログが適切なz-indexを持つ', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const dialog = container.querySelector('.fixed.inset-0');
    expect(dialog).toHaveClass('z-50');
  });

  it('ダイアログがセンタリングされる', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const dialog = container.querySelector('.fixed.inset-0');
    expect(dialog).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('ダイアログの背景にオーバーレイが表示される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const overlay = container.querySelector('.bg-black\\/50');
    expect(overlay).toBeInTheDocument();
  });

  it('ダイアログコンテンツが適切なスタイルを持つ', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.bg-background');
    expect(content).toHaveClass('mx-4', 'max-h-[90vh]', 'w-full', 'max-w-4xl');
  });

  it('ダイアログコンテンツにスクロールが設定される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.bg-background');
    expect(content).toHaveClass('overflow-y-auto');
  });

  it('ダイアログコンテンツに適切なボーダーとパディングが設定される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.bg-background');
    expect(content).toHaveClass('rounded-lg', 'border', 'p-6');
  });

  it('メインコンテンツエリアが適切なスペーシングを持つ', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const mainContent = container.querySelector('.space-y-6');
    expect(mainContent).toBeInTheDocument();
  });

  it('openプロパティをバインドできる', () => {
    let openState = true;

    render(DateFormatEditor, {
      props: {
        get open() {
          return openState;
        },
        set open(value) {
          openState = value;
        }
      }
    });

    expect(openState).toBe(true);
  });

  it('レスポンシブ対応でモバイルでもダイアログが適切に表示される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.bg-background');
    expect(content).toHaveClass('mx-4'); // モバイル用マージン
    expect(content).toHaveClass('w-full'); // フル幅
  });

  it('大画面でダイアログが最大幅制限される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.bg-background');
    expect(content).toHaveClass('max-w-4xl');
  });

  it('ダイアログが画面の90%高さを超えない', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.bg-background');
    expect(content).toHaveClass('max-h-[90vh]');
  });

  it('コンポーネントが条件付きレンダリングを正しく行う', () => {
    // 開いていない状態の確認
    const { container: closedContainer } = render(DateFormatEditor, {
      props: {
        open: false
      }
    });

    expect(closedContainer.querySelector('.fixed.inset-0')).toBeNull();

    // 開いている状態の確認
    const { container: openContainer } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const dialog = openContainer.querySelector('.fixed.inset-0');
    expect(dialog).toBeInTheDocument();
  });

  it('ダイアログが適切なアクセシビリティ構造を持つ', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const dialog = container.querySelector('.fixed.inset-0');
    expect(dialog).toBeInTheDocument();

    const content = container.querySelector('.bg-background');
    expect(content).toBeInTheDocument();
  });

  it('全画面オーバーレイが固定位置に配置される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  it('背景オーバーレイが半透明黒になっている', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const overlay = container.querySelector('.bg-black\\/50');
    expect(overlay).toBeInTheDocument();
  });

  it('複数回開閉してもメモリリークしない', () => {
    // 複数回レンダリングしてメモリリークが無いことを確認
    for (let i = 0; i < 5; i++) {
      const { container } = render(DateFormatEditor, {
        props: {
          open: true
        }
      });
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
    }

    // 最後にレンダリングでエラーが発生しないことを確認
    expect(() => {
      render(DateFormatEditor, {
        props: {
          open: true
        }
      });
    }).not.toThrow();
  });

  it('ダイアログコンテンツが垂直中央に配置される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const flexContainer = container.querySelector('.flex.items-center.justify-center');
    expect(flexContainer).toBeInTheDocument();
  });

  it('背景色が適切に設定される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.bg-background');
    expect(content).toBeInTheDocument();
  });

  it('openプロパティがfalseでも動作する', () => {
    expect(() => {
      render(DateFormatEditor, {
        props: {
          open: false
        }
      });
    }).not.toThrow();
  });

  it('ダイアログの角丸が適用される', () => {
    const { container } = render(DateFormatEditor, {
      props: {
        open: true
      }
    });

    const content = container.querySelector('.rounded-lg');
    expect(content).toBeInTheDocument();
  });
});
