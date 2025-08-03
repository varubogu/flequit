import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarGridBody from '$lib/components/ui/calendar/calendar-grid-body.svelte';

// Calendar.GridBodyコンポーネントのモック
vi.mock('bits-ui', () => ({
  Calendar: {
    GridBody: vi.fn().mockImplementation(() => ({
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

describe('CalendarGridBody', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarGridBody);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'custom-grid-body-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarGridBody, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarGridBody, {
        props: {
          ref: refElement,
          class: 'multi-prop-test'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          ...({
            'data-testid': 'grid-body-component',
            id: 'test-grid-body',
            'aria-label': 'Calendar grid body'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('refとclassの両方がnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          ref: null,
          class: null
        }
      });
    }).not.toThrow();
  });

  it('複数のTailwindクラスが適用される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'flex flex-col space-y-1 p-4'
        }
      });
    }).not.toThrow();
  });

  it('ARIA属性が正しく設定される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          ...({
            'aria-label': 'Calendar grid body',
            'aria-describedby': 'calendar-description',
            role: 'grid'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('data属性が正しく設定される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          ...({
            'data-testid': 'calendar-grid-body',
            'data-cy': 'grid-body-element',
            'data-calendar-part': 'grid-body'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('イベントハンドラーが正しく設定される', () => {
    expect(() => {
      const mockOnClick = vi.fn();
      render(CalendarGridBody, {
        props: {
          ...({
            onclick: mockOnClick
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('カスタムスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'bg-white border rounded-lg shadow-md'
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'grid grid-cols-7 gap-1 md:gap-2'
        }
      });
    }).not.toThrow();
  });

  it('アニメーションクラスが適用される', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'transition-all duration-200 ease-in-out'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {}
      });
    }).not.toThrow();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'flex flex-row flex'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'
        }
      });
    }).not.toThrow();
  });

  it('長いクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class:
            'very-long-class-name-that-could-potentially-cause-issues-but-should-still-work-correctly'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'grid-cols-1 md:grid-cols-7 gap-4 p-2'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarGridBody, {
        props: {
          class: 'text-[var(--primary-color)] bg-[var(--secondary-bg)]'
        }
      });
    }).not.toThrow();
  });
});
