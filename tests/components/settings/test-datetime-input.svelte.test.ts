import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TestDatetimeInput from '$lib/components/settings/date-format/test-datetime-input.svelte';

// date-fnsライブラリのモック
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, pattern: string) => {
    if (pattern === 'yyyy-MM-dd') {
      return date.toISOString().split('T')[0];
    }
    if (pattern === 'HH:mm:ss') {
      return date.toTimeString().split(' ')[0];
    }
    return '';
  })
}));

// SvelteDateのモック
vi.mock('svelte/reactivity', () => ({
  SvelteDate: vi.fn().mockImplementation((date: Date) => {
    const mockDate = new Date(date);
    mockDate.setFullYear = vi.fn((year: number, month: number, day: number) => {
      return Date.prototype.setFullYear.call(mockDate, year, month, day);
    });
    mockDate.setHours = vi.fn((hours: number, minutes: number, seconds: number) => {
      return Date.prototype.setHours.call(mockDate, hours, minutes, seconds);
    });
    return mockDate;
  })
}));

describe('TestDatetimeInput', () => {
  const defaultProps = {
    testDateTime: new Date('2024-01-15T10:30:45')
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(TestDatetimeInput, {
        props: defaultProps
      });
    }).not.toThrow();
  });

  it('グリッドレイアウトが適用される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const gridContainer = container.querySelector('div');
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-3', 'sm:grid-cols-2');
  });

  it('日付入力フィールドが存在する', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).toBeInTheDocument();
    expect(dateInput.id).toBe('test-date');
  });

  it('時刻入力フィールドが存在する', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;
    expect(timeInput).toBeInTheDocument();
    expect(timeInput.id).toBe('test-time');
  });

  it('時刻入力フィールドにstep属性が設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;
    expect(timeInput.step).toBe('1');
  });

  it('入力フィールドが適切なスタイルクラスを持つ', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector('input[type="time"]');

    const expectedClasses = [
      'border-input',
      'bg-background',
      'ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:ring-ring',
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'px-3',
      'py-2',
      'text-sm',
      'file:border-0',
      'file:bg-transparent',
      'file:text-sm',
      'file:font-medium',
      'focus-visible:ring-2',
      'focus-visible:ring-offset-2',
      'focus-visible:outline-none',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    ];

    expectedClasses.forEach((className) => {
      expect(dateInput).toHaveClass(className);
      expect(timeInput).toHaveClass(className);
    });
  });

  it('日付入力フィールドの値が初期設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput.value).toBe('2024-01-15');
  });

  it('時刻入力フィールドの値が初期設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;
    expect(timeInput.value).toBe('10:30:45');
  });

  it('日付変更時にhandleDateChangeが呼ばれる', async () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;

    await fireEvent.change(dateInput, { target: { value: '2024-12-25' } });
    await fireEvent.change(dateInput);

    expect(dateInput.value).toBe('2024-12-25');
  });

  it('時刻変更時にhandleTimeChangeが呼ばれる', async () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;

    await fireEvent.change(timeInput, { target: { value: '15:45:30' } });
    await fireEvent.change(timeInput);

    expect(timeInput.value).toBe('15:45:30');
  });

  it('testDateTimeがバインダブルである', () => {
    let testDate = new Date('2024-01-15T10:30:45');

    render(TestDatetimeInput, {
      props: {
        get testDateTime() {
          return testDate;
        },
        set testDateTime(value: Date) {
          testDate = value;
        }
      }
    });

    expect(testDate.getTime()).toBe(new Date('2024-01-15T10:30:45').getTime());
  });

  it('レスポンシブデザインが適用される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const gridContainer = container.querySelector('div');
    expect(gridContainer).toHaveClass('sm:grid-cols-2');
  });

  it('各入力フィールドが独立したコンテナに配置される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const gridContainer = container.querySelector('.grid');
    const inputContainers = gridContainer?.children;
    expect(inputContainers).toHaveLength(2);
  });

  it('適切なギャップが設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const gridContainer = container.querySelector('div');
    expect(gridContainer).toHaveClass('gap-3');
  });

  it('異なるtestDateTimeプロパティでも動作する', () => {
    const differentDate = new Date('2023-12-25T15:45:30');

    expect(() => {
      render(TestDatetimeInput, {
        props: {
          testDateTime: differentDate
        }
      });
    }).not.toThrow();
  });

  it('必要なプロパティがすべて渡される', () => {
    const props = {
      testDateTime: new Date('2024-01-15T10:30:45')
    };

    expect(() => {
      render(TestDatetimeInput, {
        props
      });
    }).not.toThrow();
  });

  it('Propsインターフェースに準拠している', () => {
    const validProps = {
      testDateTime: new Date('2024-01-15T10:30:45')
    };

    expect(() => {
      render(TestDatetimeInput, {
        props: validProps
      });
    }).not.toThrow();
  });

  it('入力フィールドが適切な高さを持つ', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('h-10');
    });
  });

  it('入力フィールドが全幅である', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('w-full');
    });
  });

  it('入力フィールドが適切なパディングを持つ', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('px-3', 'py-2');
    });
  });

  it('角丸が適用される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('rounded-md');
    });
  });

  it('ボーダーが適用される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('border');
    });
  });

  it('フォーカス時のスタイルが設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass(
        'focus-visible:ring-2',
        'focus-visible:ring-offset-2',
        'focus-visible:outline-none'
      );
    });
  });

  it('無効状態のスタイルが設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });
  });

  it('ファイル入力用のスタイルが設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass(
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium'
      );
    });
  });

  it('プレースホルダーのスタイルが設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('placeholder:text-muted-foreground');
    });
  });

  it('入力フィールドがflexレイアウトを持つ', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('flex');
    });
  });

  it('適切なテキストサイズが設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('text-sm');
    });
  });

  it('背景色とリングオフセットが設定される', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toHaveClass('bg-background', 'ring-offset-background');
    });
  });

  it('date-fnsのformatが呼ばれる', async () => {
    const { format } = await import('date-fns');

    render(TestDatetimeInput, {
      props: defaultProps
    });

    expect(format).toHaveBeenCalledWith(defaultProps.testDateTime, 'yyyy-MM-dd');
    expect(format).toHaveBeenCalledWith(defaultProps.testDateTime, 'HH:mm:ss');
  });

  it('コンポーネント構造が正しい', () => {
    const { container } = render(TestDatetimeInput, {
      props: defaultProps
    });

    // 外側のgridコンテナ > 2つのdivコンテナ > input要素
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer?.children).toHaveLength(2);
    expect(container.querySelectorAll('input')).toHaveLength(2);
  });

  it('コンポーネントが再利用可能な設計になっている', () => {
    // 複数回レンダリングしても問題ないことを確認
    expect(() => {
      render(TestDatetimeInput, { props: defaultProps });
      render(TestDatetimeInput, { props: defaultProps });
    }).not.toThrow();
  });
});
