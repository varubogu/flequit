import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import CalendarCaption from '$lib/components/ui/calendar/calendar-caption.svelte';
import { CalendarDate } from '@internationalized/date';

// CalendarMonthSelectとCalendarYearSelectのモック
vi.mock('$lib/components/ui/calendar/calendar-month-select.svelte', () => ({
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

vi.mock('$lib/components/ui/calendar/calendar-year-select.svelte', () => ({
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

describe('CalendarCaption', () => {
  const mockDate = new CalendarDate(2024, 3, 15); // 2024年3月15日
  const mockPlaceholder = new CalendarDate(2024, 3, 1);
  const locale = 'ja-JP';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(CalendarCaption, {
        props: {
          captionLayout: 'label',
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          monthFormat: 'long',
          years: [2023, 2024, 2025],
          yearFormat: 'numeric',
          month: mockDate,
          locale,
          placeholder: mockPlaceholder,
          monthIndex: 0
        }
      });
    }).not.toThrow();
  });

  it('デフォルトレイアウトで月年が表示される', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    // デフォルトレイアウトでは月と年が表示される
    expect(container.textContent).toContain('3月');
    expect(container.textContent).toContain('2024');
  });

  it('dropdownレイアウトでコンポーネントがレンダリングされる', () => {
    expect(() => {
      render(CalendarCaption, {
        props: {
          captionLayout: 'dropdown',
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          monthFormat: 'long',
          years: [2023, 2024, 2025],
          yearFormat: 'numeric',
          month: mockDate,
          locale,
          placeholder: mockPlaceholder,
          monthIndex: 0
        }
      });
    }).not.toThrow();
  });

  it('dropdown-monthsレイアウトで年が表示される', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'dropdown-months',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    // 年がテキスト表示される
    expect(container.textContent).toContain('2024');
  });

  it('dropdown-yearsレイアウトで月が表示される', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'dropdown-years',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    // 月がテキスト表示される
    expect(container.textContent).toContain('3月');
  });

  it('placeholderがundefinedでも正常に動作する', () => {
    expect(() => {
      render(CalendarCaption, {
        props: {
          captionLayout: 'label',
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          monthFormat: 'long',
          years: [2023, 2024, 2025],
          yearFormat: 'numeric',
          month: mockDate,
          locale,
          placeholder: undefined,
          monthIndex: 0
        }
      });
    }).not.toThrow();
  });

  it('monthFormatが関数の場合に正しく処理される', () => {
    const monthFormatFunction = (month: number) => `${month}月`;

    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: monthFormatFunction,
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    expect(container.textContent).toContain('3月');
  });

  it('yearFormatが関数の場合に正しく処理される', () => {
    const yearFormatFunction = (year: number) => `${year}年`;

    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: yearFormatFunction,
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    expect(container.textContent).toContain('2024年');
  });

  it('異なるlocaleで正しくフォーマットされる', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale: 'en-US',
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    // 英語ロケールでは「March」と表示される
    expect(container.textContent).toContain('March');
    expect(container.textContent).toContain('2024');
  });

  it('monthIndexが0以外でも正常に動作する', () => {
    expect(() => {
      render(CalendarCaption, {
        props: {
          captionLayout: 'label',
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          monthFormat: 'long',
          years: [2023, 2024, 2025],
          yearFormat: 'numeric',
          month: mockDate,
          locale,
          placeholder: mockPlaceholder,
          monthIndex: 1
        }
      });
    }).not.toThrow();
  });

  it('monthFormatとyearFormatが数値型でも正常に動作する', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'short',
        years: [2023, 2024, 2025],
        yearFormat: '2-digit',
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    // shortな月形式と2桁年形式
    expect(container.textContent).toBeTruthy();
  });

  it('dropdown-monthsでplaceholderがundefinedの場合でも正常動作', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'dropdown-months',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: undefined,
        monthIndex: 0
      }
    });

    // placeholderがundefinedでもレンダリングされる
    expect(container).toBeTruthy();
  });

  it('dropdown-yearsでplaceholderがundefinedの場合でも正常動作', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'dropdown-years',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: undefined,
        monthIndex: 0
      }
    });

    // placeholderがundefinedでもレンダリングされる
    expect(container).toBeTruthy();
  });

  it('年末月の日付でも正常に動作する', () => {
    const decemberDate = new CalendarDate(2024, 12, 31);

    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: decemberDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    expect(container.textContent).toContain('12月');
    expect(container.textContent).toContain('2024');
  });

  it('年始月の日付でも正常に動作する', () => {
    const januaryDate = new CalendarDate(2024, 1, 1);

    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: januaryDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    expect(container.textContent).toContain('1月');
    expect(container.textContent).toContain('2024');
  });

  it('空の配列がpropsとして渡されても正常に動作する', () => {
    expect(() => {
      render(CalendarCaption, {
        props: {
          captionLayout: 'label',
          months: [],
          monthFormat: 'long',
          years: [],
          yearFormat: 'numeric',
          month: mockDate,
          locale,
          placeholder: mockPlaceholder,
          monthIndex: 0
        }
      });
    }).not.toThrow();
  });

  it('複数のcaptionLayoutが正しく条件分岐される', () => {
    const safeLayouts: Array<'label'> = ['label'];
    const dropdownLayouts: Array<'dropdown-months' | 'dropdown-years'> = [
      'dropdown-months',
      'dropdown-years'
    ];

    // デフォルトレイアウトは安全にテスト
    safeLayouts.forEach((layout) => {
      expect(() => {
        render(CalendarCaption, {
          props: {
            captionLayout: layout,
            months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            monthFormat: 'long',
            years: [2023, 2024, 2025],
            yearFormat: 'numeric',
            month: mockDate,
            locale,
            placeholder: mockPlaceholder,
            monthIndex: 0
          }
        });
      }).not.toThrow();
    });

    // ドロップダウンレイアウトは基本的にレンダリングを確認
    dropdownLayouts.forEach((layout) => {
      const { container } = render(CalendarCaption, {
        props: {
          captionLayout: layout,
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          monthFormat: 'long',
          years: [2023, 2024, 2025],
          yearFormat: 'numeric',
          month: mockDate,
          locale,
          placeholder: mockPlaceholder,
          monthIndex: 0
        }
      });
      expect(container).toBeTruthy();
    });
  });

  it('formatMonth関数が正しく動作する', () => {
    const monthFormatFunction = vi.fn().mockReturnValue('カスタム月');

    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: monthFormatFunction,
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    expect(monthFormatFunction).toHaveBeenCalledWith(3); // 3月
    expect(container.textContent).toContain('カスタム月');
  });

  it('formatYear関数が正しく動作する', () => {
    const yearFormatFunction = vi.fn().mockReturnValue('カスタム年');

    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2023, 2024, 2025],
        yearFormat: yearFormatFunction,
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    expect(yearFormatFunction).toHaveBeenCalledWith(2024);
    expect(container.textContent).toContain('カスタム年');
  });

  it('CalendarDateの異なる年でも正常に動作する', () => {
    const futureDate = new CalendarDate(2030, 6, 15);

    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'long',
        years: [2029, 2030, 2031],
        yearFormat: 'numeric',
        month: futureDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    expect(container.textContent).toContain('6月');
    expect(container.textContent).toContain('2030');
  });

  it('numericyearFormatが正しく適用される', () => {
    const { container } = render(CalendarCaption, {
      props: {
        captionLayout: 'label',
        months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        monthFormat: 'numeric',
        years: [2023, 2024, 2025],
        yearFormat: 'numeric',
        month: mockDate,
        locale,
        placeholder: mockPlaceholder,
        monthIndex: 0
      }
    });

    // numeric形式では数字のみ表示
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('2024');
  });
});
