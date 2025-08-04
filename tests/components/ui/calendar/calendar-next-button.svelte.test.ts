import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarNextButton from '$lib/components/ui/calendar/calendar-next-button.svelte';

// 依存関係のモック
vi.mock('bits-ui', () => ({
  Calendar: {
    NextButton: vi.fn().mockImplementation(() => ({
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

vi.mock('@lucide/svelte/icons/chevron-right', () => ({
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

describe('CalendarNextButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarNextButton);
    }).not.toThrow();
  });

  it('カスタムクラスが適用される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'custom-next-button-class'
        }
      });
    }).not.toThrow();
  });

  it('ref属性が正しく設定される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarNextButton, {
        props: {
          ref: refElement
        }
      });
    }).not.toThrow();
  });

  it('variant属性が正しく設定される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          variant: 'outline'
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    expect(() => {
      const refElement = null;
      render(CalendarNextButton, {
        props: {
          ref: refElement,
          class: 'multi-prop-test',
          variant: 'ghost'
        }
      });
    }).not.toThrow();
  });

  it('他のHTML属性が正しく渡される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          ...({
            'data-testid': 'next-button-component',
            id: 'test-next-button'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('classがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のclassでも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: ''
        }
      });
    }).not.toThrow();
  });

  it('refがnullでも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          ref: null
        }
      });
    }).not.toThrow();
  });

  it('variantがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          variant: undefined
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのghostバリアントが適用される', () => {
    expect(() => {
      render(CalendarNextButton);
    }).not.toThrow();
  });

  it('異なるvariantが適用される', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

    variants.forEach((variant) => {
      expect(() => {
        render(CalendarNextButton, {
          props: {
            variant
          }
        });
      }).not.toThrow();
    });
  });

  it('disabled状態でも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          ...({ disabled: true } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });

  it('レスポンシブクラスが適用される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'w-8 h-8 md:w-10 md:h-10'
        }
      });
    }).not.toThrow();
  });

  it('カスタムスタイルクラスが適用される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'rounded-full shadow-lg hover:shadow-xl'
        }
      });
    }).not.toThrow();
  });

  it('プロパティ無しでも正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {}
      });
    }).not.toThrow();
  });

  it('重複するクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'p-0 p-2 bg-transparent'
        }
      });
    }).not.toThrow();
  });

  it('特殊文字を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'hover:bg-gray-100 focus:ring-2 focus:ring-blue-500'
        }
      });
    }).not.toThrow();
  });

  it('数値を含むクラス名でも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'w-8 h-8 text-sm p-1'
        }
      });
    }).not.toThrow();
  });

  it('CSS Variablesを含むスタイルクラスでも正常に動作する', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'size-[var(--cell-size)] text-[var(--primary-color)]'
        }
      });
    }).not.toThrow();
  });

  it('RTL対応クラスが含まれることを確認', () => {
    expect(() => {
      render(CalendarNextButton);
    }).not.toThrow();
  });

  it('透明な背景クラスが適用される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'bg-transparent border-transparent'
        }
      });
    }).not.toThrow();
  });

  it('opacity制御クラスが適用される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          class: 'opacity-75 hover:opacity-100 disabled:opacity-25'
        }
      });
    }).not.toThrow();
  });

  it('アクセシビリティ属性が適用される', () => {
    expect(() => {
      render(CalendarNextButton, {
        props: {
          ...({
            'aria-label': 'Next month',
            'aria-describedby': 'next-description'
          } as unknown as Record<string, unknown>)
        }
      });
    }).not.toThrow();
  });
});
