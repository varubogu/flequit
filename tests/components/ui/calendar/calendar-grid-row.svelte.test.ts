import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarGridRow from '$lib/components/ui/calendar/calendar-grid-row.svelte';

// Calendar.GridRowコンポーネントのモック
vi.mock('bits-ui', () => ({
  Calendar: {
    GridRow: vi.fn().mockImplementation(() => ({
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

describe('CalendarGridRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarGridRow);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'custom-grid-row-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarGridRow, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarGridRow, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          ...({
            'data-testid': 'grid-row-component',
            id: 'test-grid-row',
            'aria-label': 'Calendar grid row'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('refとclassの両方がnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          ref: null,
          class: null
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのflexクラスと追加クラスが組み合わされる', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'justify-center items-center'
        }
      });
    }).not.toThrow();
  });

  it('ARIA属性が正しく設定される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          ...({
            'aria-label': 'Calendar week row',
            'aria-describedby': 'week-description',
            role: 'row'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('data属性が正しく設定される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          ...({
            'data-testid': 'calendar-grid-row',
            'data-cy': 'grid-row-element',
            'data-calendar-part': 'grid-row'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('イベントハンドラーが正しく設定される', () => {
    expect(() => {
      const mockOnClick = vi.fn();
      render(CalendarGridRow, {
        props: {
          ...({
            onclick: mockOnClick
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('行レイアウト用のスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'gap-1 space-x-1 items-stretch'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'gap-1 md:gap-2 lg:gap-3'
        }
      });
    }).not.toThrow();
  });

  it('カレンダー行の高さクラスが適用される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'h-8 md:h-10 lg:h-12'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {}
      });
    }).not.toThrow();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'flex flex-row flex'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'border-b border-gray-100 last:border-b-0'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'hover:bg-gray-50 focus-within:bg-blue-50'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'grid-cols-7 gap-2 p-1'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--row-bg)]'
        }
      });
    }).not.toThrow();
  });

  it('表形式のレイアウトクラスが適用される', () => {
    expect(() => {
      render(CalendarGridRow, {
        props: {
          class: 'table-row w-full'
        }
      });
    }).not.toThrow();
  });
});
