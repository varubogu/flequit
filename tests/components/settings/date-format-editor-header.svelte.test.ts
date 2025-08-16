import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import DateFormatEditorHeader from '$lib/components/settings/date-format/date-format-editor-header.svelte';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const translations: Record<string, string> = {
        date_format_editor: 'TEST_DATE_FORMAT_EDITOR',
        close: 'TEST_CLOSE'
      };
      return translations[key] || key;
    })
  }))
}));

describe('DateFormatEditorHeader', () => {
  const mockOnClose = vi.fn();

  const defaultProps = {
    onClose: mockOnClose
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(DateFormatEditorHeader, {
        props: defaultProps
      });
    }).not.toThrow();
  });

  it('ヘッダータイトルが表示される', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    expect(getByText('TEST_DATE_FORMAT_EDITOR')).toBeInTheDocument();
  });

  it('閉じるボタンが表示される', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const closeButton = getByText('TEST_CLOSE');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.tagName).toBe('BUTTON');
  });

  it('閉じるボタンがクリックできる', async () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const closeButton = getByText('TEST_CLOSE');
    await fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('ヘッダーがflexレイアウトになっている', () => {
    const { container } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const headerDiv = container.querySelector('div');
    expect(headerDiv).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('ヘッダータイトルが適切なスタイルクラスを持つ', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const titleElement = getByText('TEST_DATE_FORMAT_EDITOR');
    expect(titleElement).toHaveClass('text-xl', 'font-semibold');
    expect(titleElement.tagName).toBe('H2');
  });

  it('閉じるボタンがghostバリアントになっている', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const closeButton = getByText('TEST_CLOSE');
    expect(closeButton).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
  });

  it('閉じるボタンがsmサイズになっている', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const closeButton = getByText('TEST_CLOSE');
    expect(closeButton).toHaveClass('h-9'); // smサイズはh-9
  });

  it('ヘッダーに適切なマージンボトムが設定される', () => {
    const { container } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const headerDiv = container.querySelector('div');
    expect(headerDiv).toHaveClass('mb-6');
  });

  it('onCloseコールバックが複数回呼べる', async () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const closeButton = getByText('TEST_CLOSE');

    await fireEvent.click(closeButton);
    await fireEvent.click(closeButton);
    await fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(3);
  });

  it('閉じるボタンにfocusが当たる', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const closeButton = getByText('TEST_CLOSE');
    closeButton.focus();

    expect(document.activeElement).toBe(closeButton);
  });

  it('レスポンシブレイアウトでも適切に表示される', () => {
    const { container } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const headerDiv = container.querySelector('div');
    expect(headerDiv).toHaveClass('justify-between');
  });

  it('ヘッダータイトルとボタンが左右に配置される', () => {
    const { container, getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const headerDiv = container.querySelector('div');
    const titleElement = getByText('TEST_DATE_FORMAT_EDITOR');
    const closeButton = getByText('TEST_CLOSE');

    expect(headerDiv).toContainElement(titleElement);
    expect(headerDiv).toContainElement(closeButton);
    expect(headerDiv).toHaveClass('justify-between');
  });

  it('異なるonCloseコールバックでも動作する', async () => {
    const alternativeMockOnClose = vi.fn();

    const { getByText } = render(DateFormatEditorHeader, {
      props: {
        onClose: alternativeMockOnClose
      }
    });

    const closeButton = getByText('TEST_CLOSE');
    await fireEvent.click(closeButton);

    expect(alternativeMockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('スクリーンリーダー対応でセマンティックな構造になっている', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const titleElement = getByText('TEST_DATE_FORMAT_EDITOR');
    const closeButton = getByText('TEST_CLOSE');

    expect(titleElement.tagName).toBe('H2');
    expect(closeButton.tagName).toBe('BUTTON');
  });

  it('CSS Flexboxプロパティが正しく適用される', () => {
    const { container } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const headerDiv = container.querySelector('div');
    expect(headerDiv).toHaveClass('flex');
    expect(headerDiv).toHaveClass('items-center');
    expect(headerDiv).toHaveClass('justify-between');
  });

  it('コンポーネントが最小限のプロパティで動作する', () => {
    const minimalProps = {
      onClose: vi.fn()
    };

    const { container } = render(DateFormatEditorHeader, {
      props: minimalProps
    });

    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('翻訳されたテキストが正しく表示される', () => {
    const { getByText } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    // 翻訳キーではなく翻訳された値が表示されることを確認
    expect(getByText('TEST_DATE_FORMAT_EDITOR')).toBeInTheDocument();
    expect(getByText('TEST_CLOSE')).toBeInTheDocument();
  });

  it('ボタンにアクセシビリティ属性が適切に設定される', () => {
    const { getByRole } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const closeButton = getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('ヘッダー領域が適切な構造になっている', () => {
    const { container } = render(DateFormatEditorHeader, {
      props: defaultProps
    });

    const headerDiv = container.querySelector('div');
    const h2Element = headerDiv?.querySelector('h2');
    const buttonElement = headerDiv?.querySelector('button');

    expect(h2Element).toBeInTheDocument();
    expect(buttonElement).toBeInTheDocument();
    expect(headerDiv?.childElementCount).toBe(2);
  });
});
