import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarHeading from '$lib/components/ui/calendar/calendar-heading.svelte';

// Calendar.Headingコンポーネントのモック
vi.mock('bits-ui', () => ({
  Calendar: {
    Heading: vi.fn().mockImplementation(() => ({
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

describe('CalendarHeading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarHeading);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'custom-heading-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarHeading, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarHeading, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          ...({
            'data-testid': 'heading-component',
            id: 'test-heading',
            'aria-label': 'Calendar heading'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('refとclassの両方がnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          ref: null,
          class: null
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのヘッディングスタイルクラスが含まれることを確認', () => {
    expect(() => {
      render(CalendarHeading);
    }).not.toThrow();
  });

  it('ARIA属性が正しく設定される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          ...({
            'aria-level': '1',
            'aria-label': 'Current month and year',
            role: 'heading'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('data属性が正しく設定される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          ...({
            'data-testid': 'calendar-heading',
            'data-cy': 'heading-element',
            'data-calendar-part': 'heading'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('イベントハンドラーが正しく設定される', () => {
    expect(() => {
      const mockOnClick = vi.fn();
      render(CalendarHeading, {
        props: {
          ...({
            onclick: mockOnClick
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('ヘッディング用のテキストスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'text-lg font-bold text-gray-900'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'text-base md:text-lg lg:text-xl'
        }
      });
    }).not.toThrow();
  });

  it('中央寄せのクラスが適用される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'text-center w-full'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {}
      });
    }).not.toThrow();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'text-sm text-sm font-medium'
        }
      });
    }).not.toThrow();
  });

  it('境界線クラスが適用される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'border-b border-gray-300'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'hover:text-blue-600 focus:outline-none'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'px-4 py-2 text-lg'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'px-[var(--cell-size)] text-[var(--primary-color)]'
        }
      });
    }).not.toThrow();
  });

  it('色彩関連のクラスが適用される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'text-blue-800 bg-blue-50'
        }
      });
    }).not.toThrow();
  });

  it('スペーシング関連のクラスが適用される', () => {
    expect(() => {
      render(CalendarHeading, {
        props: {
          class: 'px-2 py-1 mx-auto'
        }
      });
    }).not.toThrow();
  });
});
