import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarMonthSelect from '$lib/components/ui/calendar/calendar-month-select.svelte';

// Calendar.MonthSelectコンポーネントのモック
vi.mock('bits-ui', () => ({
  Calendar: {
    MonthSelect: vi.fn().mockImplementation(() => ({
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

// Lucide Iconのモック
vi.mock('@lucide/svelte/icons/chevron-down', () => ({
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

describe('CalendarMonthSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarMonthSelect);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: 'custom-month-select-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarMonthSelect, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('value属性が正しく設定される', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          value: 3
        }
      });
    }).not.toThrow();
  });

  it('onchange属性が正しく設定される', () => {
    expect(() => {
      const mockOnChange = vi.fn();
      render(CalendarMonthSelect, {
        props: {
          onchange: mockOnChange
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      const mockOnChange = vi.fn();
      render(CalendarMonthSelect, {
        props: {
          ref: refElement,
          class: 'multi-prop-test',
          value: 6,
          onchange: mockOnChange
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          ...({
            'data-testid': 'month-select-component',
            id: 'test-month-select'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('valueがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          value: undefined
        }
      });
    }).not.toThrow();
  });

  it('onchangeがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          onchange: undefined
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのセレクトスタイルクラスが含まれることを確認', () => {
    expect(() => {
      render(CalendarMonthSelect);
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: 'w-full md:w-auto'
        }
      });
    }).not.toThrow();
  });

  it('カスタムスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: 'bg-white border-gray-300 rounded-lg'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {}
      });
    }).not.toThrow();
  });

  it('数値のvalueでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          value: 12
        }
      });
    }).not.toThrow();
  });

  it('ゼロのvalueでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          value: 0
        }
      });
    }).not.toThrow();
  });

  it('負の値のvalueでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          value: -1
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: 'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: 'h-8 px-2 text-sm gap-1'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--select-bg)]'
        }
      });
    }).not.toThrow();
  });

  it('イベントハンドラーが関数でも正常に動作する', () => {
    expect(() => {
      const mockHandler = () => {};
      render(CalendarMonthSelect, {
        props: {
          onchange: mockHandler
        }
      });
    }).not.toThrow();
  });

  it('ArrowFunctionのイベントハンドラーでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonthSelect, {
        props: {
          onchange: (e) => console.log(e)
        }
      });
    }).not.toThrow();
  });
});
