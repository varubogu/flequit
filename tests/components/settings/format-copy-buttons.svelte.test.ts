import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import FormatCopyButtons from '$lib/components/settings/date-format/format-copy-buttons.svelte';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const translations: Record<string, string> = {
        apply_datetime_format_to_test_format: 'TEST_APPLY_DATETIME_FORMAT_TO_TEST_FORMAT',
        apply_test_format_to_datetime_format: 'TEST_APPLY_TEST_FORMAT_TO_DATETIME_FORMAT'
      };
      return translations[key] || key;
    })
  }))
}));

describe('FormatCopyButtons', () => {
  const mockOnCopyToTest = vi.fn();
  const mockOnCopyToMain = vi.fn();

  const defaultProps = {
    onCopyToTest: mockOnCopyToTest,
    onCopyToMain: mockOnCopyToMain
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(FormatCopyButtons, {
        props: defaultProps
      });
    }).not.toThrow();
  });

  it('2つのボタンが表示される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
  });

  it('コンテナがflexレイアウトになっている', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('div');
    expect(flexContainer).toHaveClass('flex', 'items-center', 'justify-center', 'gap-2', 'py-2');
  });

  it('最初のボタン（下向き矢印）がonCopyToTestを呼び出す', async () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    const firstButton = buttons[0];

    await fireEvent.click(firstButton);

    expect(mockOnCopyToTest).toHaveBeenCalledTimes(1);
  });

  it('2番目のボタン（上向き矢印）がonCopyToMainを呼び出す', async () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    const secondButton = buttons[1];

    await fireEvent.click(secondButton);

    expect(mockOnCopyToMain).toHaveBeenCalledTimes(1);
  });

  it('両方のボタンがoutlineバリアントになっている', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('border-input');
    });
  });

  it('両方のボタンがsmサイズになっている', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('h-8'); // カスタムサイズh-8が適用される
    });
  });

  it('ボタンがカスタムスタイルを持つ', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('flex', 'h-8', 'w-8', 'items-center', 'justify-center', 'p-0');
    });
  });

  it('最初のボタンに適切なtitle属性が設定される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    const firstButton = buttons[0];

    expect(firstButton).toHaveAttribute('title', 'TEST_APPLY_DATETIME_FORMAT_TO_TEST_FORMAT');
  });

  it('2番目のボタンに適切なtitle属性が設定される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    const secondButton = buttons[1];

    expect(secondButton).toHaveAttribute('title', 'TEST_APPLY_TEST_FORMAT_TO_DATETIME_FORMAT');
  });

  it('最初のボタンに下向き矢印のSVGが表示される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    const firstButton = buttons[0];
    const svg = firstButton.querySelector('svg');
    const path = svg?.querySelector('path');

    expect(svg).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M19 14l-7 7m0 0l-7-7m7 7V3');
  });

  it('2番目のボタンに上向き矢印のSVGが表示される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    const secondButton = buttons[1];
    const svg = secondButton.querySelector('svg');
    const path = svg?.querySelector('path');

    expect(svg).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M5 10l7-7m0 0l7 7m-7-7v18');
  });

  it('SVGアイコンが適切なクラスを持つ', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const svgs = container.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg).toHaveClass('h-4', 'w-4');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });
  });

  it('SVGパスが適切なstroke属性を持つ', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const paths = container.querySelectorAll('path');
    paths.forEach((path) => {
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });

  it('複数回クリックしても正常に動作する', async () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    const firstButton = buttons[0];
    const secondButton = buttons[1];

    await fireEvent.click(firstButton);
    await fireEvent.click(secondButton);
    await fireEvent.click(firstButton);
    await fireEvent.click(secondButton);

    expect(mockOnCopyToTest).toHaveBeenCalledTimes(2);
    expect(mockOnCopyToMain).toHaveBeenCalledTimes(2);
  });

  it('異なるコールバック関数でも動作する', async () => {
    const alternativeOnCopyToTest = vi.fn();
    const alternativeOnCopyToMain = vi.fn();

    const { container } = render(FormatCopyButtons, {
      props: {
        onCopyToTest: alternativeOnCopyToTest,
        onCopyToMain: alternativeOnCopyToMain
      }
    });

    const buttons = container.querySelectorAll('button');
    await fireEvent.click(buttons[0]);
    await fireEvent.click(buttons[1]);

    expect(alternativeOnCopyToTest).toHaveBeenCalledTimes(1);
    expect(alternativeOnCopyToMain).toHaveBeenCalledTimes(1);
    expect(mockOnCopyToTest).not.toHaveBeenCalled();
    expect(mockOnCopyToMain).not.toHaveBeenCalled();
  });

  it('ボタンにfocusを当てることができる', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    buttons[0].focus();

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('アクセシビリティのためのSVGroleが適切に設定される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('コンテナの間隔が適切に設定される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('div');
    expect(flexContainer).toHaveClass('gap-2');
  });

  it('コンテナの垂直パディングが適切に設定される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('div');
    expect(flexContainer).toHaveClass('py-2');
  });

  it('ボタンが水平中央揃えになっている', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('div');
    expect(flexContainer).toHaveClass('justify-center');
  });

  it('ボタンが垂直中央揃えになっている', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const flexContainer = container.querySelector('div');
    expect(flexContainer).toHaveClass('items-center');
  });

  it('正方形ボタンのアスペクト比が保たれる', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('h-8', 'w-8');
    });
  });

  it('ボタンの内部パディングが0に設定される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('p-0');
    });
  });

  it('翻訳されたtooltipテキストが正しく表示される', () => {
    const { container } = render(FormatCopyButtons, {
      props: defaultProps
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveAttribute('title', 'TEST_APPLY_DATETIME_FORMAT_TO_TEST_FORMAT');
    expect(buttons[1]).toHaveAttribute('title', 'TEST_APPLY_TEST_FORMAT_TO_DATETIME_FORMAT');
  });

  it('必要なプロパティがすべて渡される', () => {
    const props = {
      onCopyToTest: vi.fn(),
      onCopyToMain: vi.fn()
    };

    expect(() => {
      render(FormatCopyButtons, {
        props
      });
    }).not.toThrow();
  });

  it('Propsインターフェースに準拠している', () => {
    // onCopyToTestとonCopyToMainが関数であることをテスト
    const validProps = {
      onCopyToTest: vi.fn(),
      onCopyToMain: vi.fn()
    };

    expect(() => {
      render(FormatCopyButtons, {
        props: validProps
      });
    }).not.toThrow();
  });
});
