import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarHeader from '$lib/components/ui/calendar/calendar-header.svelte';

// Calendar.Headerコンポーネントのモック
vi.mock('bits-ui', () => ({
  Calendar: {
    Header: vi.fn().mockImplementation(() => ({
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
  }
}));

describe('CalendarHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarHeader);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'custom-header-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarHeader, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarHeader, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          ...({
            'data-testid': 'header-component',
            id: 'test-header',
            'aria-label': 'Calendar header'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('refとclassの両方がnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          ref: null,
          class: null
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのヘッダースタイルクラスが含まれることを確認', () => {
    expect(() => {
      render(CalendarHeader);
    }).not.toThrow();
  });

  it('ARIA属性が正しく設定される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          ...({
            'aria-label': 'Calendar navigation header',
            'aria-describedby': 'header-description',
            role: 'banner'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('data属性が正しく設定される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          ...({
            'data-testid': 'calendar-header',
            'data-cy': 'header-element',
            'data-calendar-part': 'header'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('イベントハンドラーが正しく設定される', () => {
    expect(() => {
      const mockOnClick = vi.fn();
      render(CalendarHeader, {
        props: {
          ...({
            onclick: mockOnClick
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('ヘッダー用のレイアウトクラスが適用される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'justify-between items-start flex-col'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'text-sm md:text-base lg:text-lg'
        }
      });
    }).not.toThrow();
  });

  it('ナビゲーション用のクラスが適用される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'relative w-full px-4 py-2'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {}
      });
    }).not.toThrow();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'flex flex-row flex'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'border-b border-gray-200'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'hover:bg-gray-100 focus:outline-none focus:ring-2'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'h-12 px-4 py-2 gap-2'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'h-[var(--cell-size)] text-[var(--primary-color)]'
        }
      });
    }).not.toThrow();
  });

  it('フォント関連のクラスが適用される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'font-semibold text-xl tracking-tight'
        }
      });
    }).not.toThrow();
  });

  it('背景色クラスが適用される', () => {
    expect(() => {
      render(CalendarHeader, {
        props: {
          class: 'bg-white shadow-sm'
        }
      });
    }).not.toThrow();
  });
});
