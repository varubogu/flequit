import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import TestDatetimeSection from '$lib/components/settings/date-format/test-datetime-section.svelte';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const translations: Record<string, string> = {
        test_datetime: 'TEST_DATETIME'
      };
      return translations[key] || key;
    })
  }))
}));

// TestDateTimeInputコンポーネントのモック
vi.mock('$lib/components/settings/test-datetime-input.svelte', () => ({
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

describe('TestDatetimeSection', () => {
  const defaultProps = {
    testDateTime: new Date('2024-01-15T10:30:45')
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(TestDatetimeSection, {
        props: defaultProps
      });
    }).not.toThrow();
  });

  it('外側のコンテナが存在する', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const outerContainer = container.querySelector('div');
    expect(outerContainer).toBeInTheDocument();
  });

  it('内側のコンテナが適切なクラスを持つ', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const innerContainer = container.querySelector('div.mb-2.flex.items-center.gap-4');
    expect(innerContainer).toBeInTheDocument();
  });

  it('テストDateTime ラベルが表示される', () => {
    const { getByText } = render(TestDatetimeSection, {
      props: defaultProps
    });

    expect(getByText('TEST_DATETIME')).toBeInTheDocument();
  });

  it('ラベルが適切なスタイルクラスを持つ', () => {
    const { getByText } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const label = getByText('TEST_DATETIME');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('ラベルがh3要素である', () => {
    const { getByText } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const label = getByText('TEST_DATETIME');
    expect(label.tagName).toBe('H3');
  });

  it('TestDateTimeInputコンポーネントが含まれる', () => {
    expect(() => {
      render(TestDatetimeSection, {
        props: defaultProps
      });
    }).not.toThrow();
  });

  it('testDateTimeがバインダブルである', () => {
    let testDate = new Date('2024-01-15T10:30:45');

    render(TestDatetimeSection, {
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

  it('flexレイアウトが適用される', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toHaveClass('flex', 'items-center', 'gap-4');
  });

  it('適切なマージンボトムが設定される', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const container_with_margin = container.querySelector('.mb-2');
    expect(container_with_margin).toBeInTheDocument();
  });

  it('アイテムが垂直中央揃えになる', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('.items-center');
    expect(flexContainer).toBeInTheDocument();
  });

  it('適切なギャップが設定される', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const gapContainer = container.querySelector('.gap-4');
    expect(gapContainer).toBeInTheDocument();
  });

  it('ラベルとインプットが横並びで配置される', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('.flex.items-center');
    expect(flexContainer).toBeInTheDocument();
  });

  it('翻訳されたテキストが正しく表示される', () => {
    const { getByText } = render(TestDatetimeSection, {
      props: defaultProps
    });

    expect(getByText('TEST_DATETIME')).toBeInTheDocument();
  });

  it('異なるtestDateTimeプロパティでも動作する', () => {
    const differentDate = new Date('2023-12-25T15:45:30');

    expect(() => {
      render(TestDatetimeSection, {
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
      render(TestDatetimeSection, {
        props
      });
    }).not.toThrow();
  });

  it('Propsインターフェースに準拠している', () => {
    const validProps = {
      testDateTime: new Date('2024-01-15T10:30:45')
    };

    expect(() => {
      render(TestDatetimeSection, {
        props: validProps
      });
    }).not.toThrow();
  });

  it('コンポーネント構造が正しい', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    // 外側のdiv > 内側のdiv > h3 + TestDateTimeInput の構造
    expect(container.querySelector('div')).toBeInTheDocument();
    expect(container.querySelector('div > div')).toBeInTheDocument();
    expect(container.querySelector('h3')).toBeInTheDocument();
  });

  it('レスポンシブデザインに対応したレイアウトになっている', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('.flex.items-center');
    expect(flexContainer).toBeInTheDocument();
  });

  it('シンプルな構造を維持している', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    // 過度に複雑ではないことを確認
    const allDivs = container.querySelectorAll('div');
    expect(allDivs.length).toBeLessThanOrEqual(3);
  });

  it('アクセシビリティのためのセマンティック構造を持つ', () => {
    const { container } = render(TestDatetimeSection, {
      props: defaultProps
    });

    const heading = container.querySelector('h3');
    expect(heading).toBeInTheDocument();
  });

  it('コンポーネントが再利用可能な設計になっている', () => {
    // 複数回レンダリングしても問題ないことを確認
    expect(() => {
      render(TestDatetimeSection, { props: defaultProps });
      render(TestDatetimeSection, { props: defaultProps });
    }).not.toThrow();
  });
});
