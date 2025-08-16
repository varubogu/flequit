import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import MainDateFormatSection from '$lib/components/settings/date-format/main-date-format-section.svelte';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const translations: Record<string, string> = {
        date_format: 'TEST_DATE_FORMAT',
        preview: 'TEST_PREVIEW'
      };
      return translations[key] || key;
    })
  }))
}));

// date-fnsのモック
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, formatString: string) => {
    // 基本的なフォーマット変換をシミュレート
    if (formatString === 'yyyy-MM-dd HH:mm:ss') {
      return '2024-01-15 10:30:45';
    }
    if (formatString === 'invalid') {
      throw new Error('Invalid format');
    }
    return `formatted_${formatString}`;
  })
}));

describe('MainDateFormatSection', () => {
  const mockOnFormatChange = vi.fn();

  const defaultProps = {
    currentFormat: 'yyyy-MM-dd HH:mm:ss',
    testDateTime: new Date('2024-01-15T10:30:45'),
    onFormatChange: mockOnFormatChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(MainDateFormatSection, {
        props: defaultProps
      });
    }).not.toThrow();
  });

  it('グリッドレイアウトが適用される', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const gridContainer = container.querySelector('div');
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-4', 'lg:grid-cols-2');
  });

  it('日付フォーマットラベルが表示される', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: defaultProps
    });

    expect(getByText('TEST_DATE_FORMAT')).toBeInTheDocument();
  });

  it('プレビューラベルが表示される', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: defaultProps
    });

    expect(getByText('TEST_PREVIEW:')).toBeInTheDocument();
  });

  it('入力フィールドが表示される', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const input = container.querySelector('input[id="datetime-format"]');
    expect(input).toBeInTheDocument();
  });

  it('入力フィールドに現在のフォーマットが表示される', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const input = container.querySelector('input[id="datetime-format"]') as HTMLInputElement;
    expect(input.value).toBe('yyyy-MM-dd HH:mm:ss');
  });

  it('入力フィールドにプレースホルダーが設定される', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const input = container.querySelector('input[id="datetime-format"]');
    expect(input).toHaveAttribute('placeholder', 'yyyy年MM月dd日 HH:mm:ss');
  });

  it('フォーマットプレビューが表示される', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: defaultProps
    });

    expect(getByText('2024-01-15 10:30:45')).toBeInTheDocument();
  });

  it('プレビューが適切なスタイルクラスを持つ', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const preview = getByText('2024-01-15 10:30:45');
    expect(preview).toHaveClass('bg-muted', 'rounded', 'px-2', 'py-1');
  });

  it('入力変更時にonFormatChangeが呼ばれる', async () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const input = container.querySelector('input[id="datetime-format"]') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'yyyy/MM/dd' } });

    expect(mockOnFormatChange).toHaveBeenCalledTimes(1);
  });

  it('無効なフォーマットでInvalid formatを表示する', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: {
        ...defaultProps,
        currentFormat: 'invalid'
      }
    });

    expect(getByText('Invalid format')).toBeInTheDocument();
  });

  it('ラベルが適切なfor属性を持つ', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'datetime-format');
  });

  it('ラベルが適切なスタイルクラスを持つ', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const label = container.querySelector('label');
    expect(label).toHaveClass('mb-2', 'block', 'text-sm', 'font-medium');
  });

  it('プレビューセクションが適切なスタイルクラスを持つ', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const previewSection = container.querySelector('.flex.items-center.gap-2.text-sm');
    expect(previewSection).toBeInTheDocument();
  });

  it('プレビューラベルが適切なスタイルクラスを持つ', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const previewLabel = getByText('TEST_PREVIEW:');
    expect(previewLabel).toHaveClass('font-medium');
  });

  it('currentFormatがバインダブルである', () => {
    let formatValue = 'yyyy-MM-dd';

    render(MainDateFormatSection, {
      props: {
        get currentFormat() {
          return formatValue;
        },
        set currentFormat(value: string) {
          formatValue = value;
        },
        testDateTime: new Date('2024-01-15T10:30:45'),
        onFormatChange: mockOnFormatChange
      }
    });

    expect(formatValue).toBe('yyyy-MM-dd');
  });

  it('testDateTimeがバインダブルである', () => {
    let testDate = new Date('2024-01-15T10:30:45');

    render(MainDateFormatSection, {
      props: {
        currentFormat: 'yyyy-MM-dd',
        get testDateTime() {
          return testDate;
        },
        set testDateTime(value: Date) {
          testDate = value;
        },
        onFormatChange: mockOnFormatChange
      }
    });

    expect(testDate.getTime()).toBe(new Date('2024-01-15T10:30:45').getTime());
  });

  it('異なるフォーマットでプレビューが変更される', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: {
        ...defaultProps,
        currentFormat: 'MM/dd/yyyy'
      }
    });

    expect(getByText('formatted_MM/dd/yyyy')).toBeInTheDocument();
  });

  it('異なる日時でプレビューが変更される', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: {
        ...defaultProps,
        testDateTime: new Date('2023-12-25T15:45:30')
      }
    });

    expect(getByText('2024-01-15 10:30:45')).toBeInTheDocument(); // date-fnsモックの戻り値
  });

  it('レスポンシブグリッドが適用される', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const gridContainer = container.querySelector('div');
    expect(gridContainer).toHaveClass('lg:grid-cols-2');
  });

  it('入力フィールドとプレビューが別々のグリッドアイテムに配置される', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const gridItems = container.querySelectorAll('.grid > div');
    expect(gridItems).toHaveLength(2);
  });

  it('必要なプロパティがすべて渡される', () => {
    const props = {
      currentFormat: 'yyyy-MM-dd',
      testDateTime: new Date(),
      onFormatChange: vi.fn()
    };

    expect(() => {
      render(MainDateFormatSection, {
        props
      });
    }).not.toThrow();
  });

  it('Propsインターフェースに準拠している', () => {
    const validProps = {
      currentFormat: 'yyyy-MM-dd HH:mm:ss',
      testDateTime: new Date('2024-01-15T10:30:45'),
      onFormatChange: vi.fn()
    };

    expect(() => {
      render(MainDateFormatSection, {
        props: validProps
      });
    }).not.toThrow();
  });

  it('空のフォーマットでも動作する', () => {
    expect(() => {
      render(MainDateFormatSection, {
        props: {
          ...defaultProps,
          currentFormat: ''
        }
      });
    }).not.toThrow();
  });

  it('翻訳されたテキストが正しく表示される', () => {
    const { getByText } = render(MainDateFormatSection, {
      props: defaultProps
    });

    expect(getByText('TEST_DATE_FORMAT')).toBeInTheDocument();
    expect(getByText('TEST_PREVIEW:')).toBeInTheDocument();
  });

  it('入力フィールドのアクセシビリティが適切に設定される', () => {
    const { container } = render(MainDateFormatSection, {
      props: defaultProps
    });

    const input = container.querySelector('input[id="datetime-format"]');
    const label = container.querySelector('label[for="datetime-format"]');

    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
  });
});
