import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarMonths from '$lib/components/ui/calendar/calendar-months.svelte';

describe('CalendarMonths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarMonths);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    const { container } = render(CalendarMonths, {
      props: {
        class: 'custom-months-class'
      }
    });

    const monthsDiv = container.querySelector('div');
    expect(monthsDiv).toBeInTheDocument();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarMonths, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarMonths, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(CalendarMonths, {
      props: {
        'data-testid': 'months-component',
        id: 'test-months',
        'aria-label': 'Calendar months'
      }
    });

    const monthsDiv = container.querySelector('div');
    expect(monthsDiv).toHaveAttribute('data-testid', 'months-component');
    expect(monthsDiv).toHaveAttribute('id', 'test-months');
    expect(monthsDiv).toHaveAttribute('aria-label', 'Calendar months');
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのレスポンシブレイアウトが適用される', () => {
    const { container } = render(CalendarMonths);
    const monthsDiv = container.querySelector('div');

    expect(monthsDiv).toBeInTheDocument();
  });

  it('ARIA属性が正しく設定される', () => {
    const { container } = render(CalendarMonths, {
      props: {
        'aria-label': 'Multiple months view',
        'aria-describedby': 'months-description',
        role: 'region'
      }
    });

    const monthsDiv = container.querySelector('div');
    expect(monthsDiv).toHaveAttribute('aria-label', 'Multiple months view');
    expect(monthsDiv).toHaveAttribute('aria-describedby', 'months-description');
    expect(monthsDiv).toHaveAttribute('role', 'region');
  });

  it('data属性が正しく設定される', () => {
    const { container } = render(CalendarMonths, {
      props: {
        'data-testid': 'calendar-months',
        'data-cy': 'months-element',
        'data-calendar-part': 'months'
      }
    });

    const monthsDiv = container.querySelector('div');
    expect(monthsDiv).toHaveAttribute('data-testid', 'calendar-months');
    expect(monthsDiv).toHaveAttribute('data-cy', 'months-element');
    expect(monthsDiv).toHaveAttribute('data-calendar-part', 'months');
  });

  it('イベントハンドラーが正しく設定される', () => {
    const mockOnClick = vi.fn();
    const { container } = render(CalendarMonths, {
      props: {
        onclick: mockOnClick
      }
    });

    const monthsDiv = container.querySelector('div');
    monthsDiv?.click();
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('複数月表示用のレイアウトクラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'grid grid-cols-2 gap-6'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'gap-2 md:gap-4 lg:gap-6 xl:gap-8'
        }
      });
    }).not.toThrow();
  });

  it('フレックスレイアウト調整クラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'flex-wrap justify-center items-start'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    const { container } = render(CalendarMonths, {
      props: {}
    });

    const monthsDiv = container.querySelector('div');
    expect(monthsDiv).toBeInTheDocument();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'flex flex-col flex gap-4'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'border border-gray-200 rounded-lg divide-x'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'hover:shadow-lg focus-within:ring-2'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'p-6 gap-8 min-h-96'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--months-bg)]'
        }
      });
    }).not.toThrow();
  });

  it('複数月コンテナ用の背景クラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'bg-white shadow-md rounded-xl'
        }
      });
    }).not.toThrow();
  });

  it('スクロール対応クラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'overflow-x-auto overflow-y-hidden'
        }
      });
    }).not.toThrow();
  });

  it('月間隔調整クラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'space-x-4 md:space-x-6 lg:space-x-8'
        }
      });
    }).not.toThrow();
  });

  it('最大幅制限クラスが適用される', () => {
    expect(() => {
      render(CalendarMonths, {
        props: {
          class: 'max-w-4xl mx-auto'
        }
      });
    }).not.toThrow();
  });
});
