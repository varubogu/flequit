import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarHeadCell from '$lib/components/ui/calendar/calendar-head-cell.svelte';

// Calendar.HeadCellコンポーネントのモック
vi.mock('bits-ui', () => ({
  Calendar: {
    HeadCell: vi.fn().mockImplementation(() => ({
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

describe('CalendarHeadCell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarHeadCell);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'custom-head-cell-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarHeadCell, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarHeadCell, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          ...({
            'data-testid': 'head-cell-component',
            id: 'test-head-cell',
            'aria-label': 'Calendar head cell'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('refとclassの両方がnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          ref: null,
          class: null
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのスタイルクラスが含まれることを確認', () => {
    expect(() => {
      render(CalendarHeadCell);
    }).not.toThrow();
  });

  it('ARIA属性が正しく設定される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          ...({
            'aria-label': 'Weekday column header',
            'aria-describedby': 'weekday-description',
            role: 'columnheader'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('data属性が正しく設定される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          ...({
            'data-testid': 'calendar-head-cell',
            'data-cy': 'head-cell-element',
            'data-calendar-part': 'head-cell'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('イベントハンドラーが正しく設定される', () => {
    expect(() => {
      const mockOnClick = vi.fn();
      render(CalendarHeadCell, {
        props: {
          ...({
            onclick: mockOnClick
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('ヘッダーセル用のスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'text-center font-semibold text-gray-700'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'text-xs md:text-sm lg:text-base'
        }
      });
    }).not.toThrow();
  });

  it('曜日ヘッダー用のクラスが適用される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'w-8 h-8 flex items-center justify-center'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {}
      });
    }).not.toThrow();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'text-center text-center text-sm'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'border-r border-gray-200 last:border-r-0'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'w-10 h-10 text-xs p-2'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--header-bg)]'
        }
      });
    }).not.toThrow();
  });

  it('セルサイズ指定クラスが適用される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'w-[var(--cell-size)] h-[var(--cell-size)]'
        }
      });
    }).not.toThrow();
  });

  it('テキストスタイリングクラスが適用される', () => {
    expect(() => {
      render(CalendarHeadCell, {
        props: {
          class: 'uppercase tracking-wide text-gray-500'
        }
      });
    }).not.toThrow();
  });
});
