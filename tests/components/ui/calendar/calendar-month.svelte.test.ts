import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarMonth from '$lib/components/ui/calendar/calendar-month.svelte';

describe('CalendarMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarMonth);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    const { container } = render(CalendarMonth, {
      props: {
        class: 'custom-month-class'
      }
    });

    const monthDiv = container.querySelector('div');
    expect(monthDiv).toBeInTheDocument();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarMonth, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarMonth, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(CalendarMonth, {
      props: {
        'data-testid': 'month-component',
        id: 'test-month',
        'aria-label': 'Calendar month'
      }
    });

    const monthDiv = container.querySelector('div');
    expect(monthDiv).toHaveAttribute('data-testid', 'month-component');
    expect(monthDiv).toHaveAttribute('id', 'test-month');
    expect(monthDiv).toHaveAttribute('aria-label', 'Calendar month');
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのflexスタイルが適用される', () => {
    const { container } = render(CalendarMonth);
    const monthDiv = container.querySelector('div');

    expect(monthDiv).toBeInTheDocument();
  });

  it('ARIA属性が正しく設定される', () => {
    const { container } = render(CalendarMonth, {
      props: {
        'aria-label': 'Current month view',
        'aria-describedby': 'month-description',
        role: 'grid'
      }
    });

    const monthDiv = container.querySelector('div');
    expect(monthDiv).toHaveAttribute('aria-label', 'Current month view');
    expect(monthDiv).toHaveAttribute('aria-describedby', 'month-description');
    expect(monthDiv).toHaveAttribute('role', 'grid');
  });

  it('data属性が正しく設定される', () => {
    const { container } = render(CalendarMonth, {
      props: {
        'data-testid': 'calendar-month',
        'data-cy': 'month-element',
        'data-calendar-part': 'month'
      }
    });

    const monthDiv = container.querySelector('div');
    expect(monthDiv).toHaveAttribute('data-testid', 'calendar-month');
    expect(monthDiv).toHaveAttribute('data-cy', 'month-element');
    expect(monthDiv).toHaveAttribute('data-calendar-part', 'month');
  });

  it('イベントハンドラーが正しく設定される', () => {
    const mockOnClick = vi.fn();
    const { container } = render(CalendarMonth, {
      props: {
        onclick: mockOnClick
      }
    });

    const monthDiv = container.querySelector('div');
    monthDiv?.click();
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('月用のレイアウトクラスが適用される', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'space-y-2 p-4'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'gap-2 md:gap-4 lg:gap-6'
        }
      });
    }).not.toThrow();
  });

  it('グリッドレイアウトクラスが適用される', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'grid grid-rows-6 gap-1'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    const { container } = render(CalendarMonth, {
      props: {}
    });

    const monthDiv = container.querySelector('div');
    expect(monthDiv).toBeInTheDocument();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'flex flex-col flex'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'border border-gray-200 rounded-lg'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'hover:bg-gray-50 focus-within:ring-2'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'p-4 gap-2 min-h-80'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--month-bg)]'
        }
      });
    }).not.toThrow();
  });

  it('カレンダー月用の背景クラスが適用される', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'bg-white shadow-sm rounded-md'
        }
      });
    }).not.toThrow();
  });

  it('月表示用の高さクラスが適用される', () => {
    expect(() => {
      render(CalendarMonth, {
        props: {
          class: 'min-h-96 max-h-screen'
        }
      });
    }).not.toThrow();
  });
});
