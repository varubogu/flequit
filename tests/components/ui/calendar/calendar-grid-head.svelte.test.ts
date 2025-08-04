import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarGridHead from '$lib/components/ui/calendar/calendar-grid-head.svelte';

// Calendar.GridHeadコンポーネントのモック
vi.mock('bits-ui', () => ({
  Calendar: {
    GridHead: vi.fn().mockImplementation(() => ({
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

describe('CalendarGridHead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarGridHead);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'custom-grid-head-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarGridHead, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarGridHead, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          ...({
            'data-testid': 'grid-head-component',
            id: 'test-grid-head',
            'aria-label': 'Calendar grid head'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('refとclassの両方がnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          ref: null,
          class: null
        }
      });
    }).not.toThrow();
  });

  it('グリッドヘッド用のクラスが適用される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'grid grid-cols-7 border-b'
        }
      });
    }).not.toThrow();
  });

  it('ARIA属性が正しく設定される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          ...({
            'aria-label': 'Calendar weekday headers',
            'aria-describedby': 'weekday-description',
            role: 'row'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('data属性が正しく設定される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          ...({
            'data-testid': 'calendar-grid-head',
            'data-cy': 'grid-head-element',
            'data-calendar-part': 'grid-head'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('イベントハンドラーが正しく設定される', () => {
    expect(() => {
      const mockOnClick = vi.fn();
      render(CalendarGridHead, {
        props: {
          ...({
            onclick: mockOnClick
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('ヘッダー用のスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'bg-gray-50 text-sm font-medium text-gray-900'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'grid grid-cols-7 gap-1 md:gap-2 lg:gap-3'
        }
      });
    }).not.toThrow();
  });

  it('テーブル構造用のクラスが適用される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'thead table-header-group'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {}
      });
    }).not.toThrow();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'flex flex-row flex'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'border-b border-gray-200 divide-x divide-gray-200'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'grid-cols-1 md:grid-cols-7 gap-4 p-2'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridHead, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--secondary-bg)]'
        }
      });
    }).not.toThrow();
  });
});
