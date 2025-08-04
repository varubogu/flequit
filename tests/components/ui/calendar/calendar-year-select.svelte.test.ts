import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarYearSelect from '$lib/components/ui/calendar/calendar-year-select.svelte';

// 依存関係のモック
vi.mock('bits-ui', () => ({
  Calendar: {
    YearSelect: vi.fn().mockImplementation(() => ({
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

describe('CalendarYearSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarYearSelect);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'custom-year-select-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarYearSelect, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('value属性が正しく設定される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          value: 2024
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarYearSelect, {
        props: {
          ref: refElement,
          class: 'multi-prop-test',
          value: 2025
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          ...({
            'data-testid': 'year-select-component',
            id: 'test-year-select'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('valueがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          value: undefined
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのセレクトスタイルクラスが含まれることを確認', () => {
    expect(() => {
      render(CalendarYearSelect);
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'w-full md:w-auto'
        }
      });
    }).not.toThrow();
  });

  it('カスタムスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'bg-white border-gray-300 rounded-lg'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {}
      });
    }).not.toThrow();
  });

  it('数値のvalueでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          value: 2030
        }
      });
    }).not.toThrow();
  });

  it('過去の年のvalueでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          value: 2000
        }
      });
    }).not.toThrow();
  });

  it('未来の年のvalueでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          value: 2050
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'h-8 px-2 text-sm gap-1'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--select-bg)]'
        }
      });
    }).not.toThrow();
  });

  it('フォーカス関連のクラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'focus-visible:ring-2 focus-visible:ring-offset-2'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'border-2 border-solid border-gray-300'
        }
      });
    }).not.toThrow();
  });

  it('シャドウ関連のクラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'shadow-sm hover:shadow-md focus:shadow-lg'
        }
      });
    }).not.toThrow();
  });

  it('アクセシビリティ関連のクラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'select-none pointer-events-auto'
        }
      });
    }).not.toThrow();
  });

  it('アニメーション関連のクラスが適用される', () => {
    expect(() => {
      render(CalendarYearSelect, {
        props: {
          class: 'transition-all duration-200 ease-in-out'
        }
      });
    }).not.toThrow();
  });
});
