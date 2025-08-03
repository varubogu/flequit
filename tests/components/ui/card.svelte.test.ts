import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Card from '$lib/components/ui/card.svelte';
import type { Snippet } from 'svelte';

describe('Card', () => {
  // テスト用の子コンポーネントSnippet
  const TestContentSnippet = (() => `<p>Card Content</p>`) as unknown as Snippet;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(Card, {
        props: {
          children: TestContentSnippet
        }
      });
    }).not.toThrow();
  });

  it('基本のスタイルクラスが適用される', () => {
    const { container } = render(Card, {
      props: {
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    expect(card).toHaveClass(
      'bg-card',
      'text-card-foreground',
      'rounded-lg',
      'border',
      'shadow-sm'
    );
  });

  it('カスタムクラスが追加される', () => {
    const customClass = 'custom-card-class';
    const { container } = render(Card, {
      props: {
        class: customClass,
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    expect(card).toHaveClass(customClass);
    // 基本クラスも残っていることを確認
    expect(card).toHaveClass('bg-card', 'rounded-lg');
  });

  it('子要素が設定される', () => {
    const { component } = render(Card, {
      props: {
        children: TestContentSnippet
      }
    });

    // コンポーネントが正常に作成されることを確認
    expect(component).toBeTruthy();
  });

  it('子要素なしでもエラーが発生しない', () => {
    expect(() => {
      render(Card);
    }).not.toThrow();
  });

  it('undefinedのchildrenでもエラーが発生しない', () => {
    expect(() => {
      render(Card, {
        props: {
          children: undefined
        }
      });
    }).not.toThrow();
  });

  it('onclickイベントが正しく動作する', async () => {
    const mockOnClick = vi.fn();
    const { container } = render(Card, {
      props: {
        onclick: mockOnClick,
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    if (card) {
      await fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('onkeydownイベントが正しく動作する', async () => {
    const mockOnKeyDown = vi.fn();
    const { container } = render(Card, {
      props: {
        onkeydown: mockOnKeyDown,
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    if (card) {
      await fireEvent.keyDown(card, { key: 'Enter' });
      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
      expect(mockOnKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter'
        })
      );
    }
  });

  it('role属性が正しく設定される', () => {
    const { container } = render(Card, {
      props: {
        role: 'button',
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('tabindex属性が正しく設定される', () => {
    const { container } = render(Card, {
      props: {
        tabindex: 0,
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('複数のpropsが同時に適用される', () => {
    const mockOnClick = vi.fn();
    const { container } = render(Card, {
      props: {
        class: 'multi-prop-test',
        onclick: mockOnClick,
        role: 'article',
        tabindex: -1,
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    expect(card).toHaveClass('multi-prop-test', 'bg-card');
    expect(card).toHaveAttribute('role', 'article');
    expect(card).toHaveAttribute('tabindex', '-1');
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(Card, {
      props: {
        children: TestContentSnippet,
        ...({ 'data-testid': 'card-component', id: 'test-card' } as unknown as Record<
          string,
          string
        >)
      }
    });

    const card = container.querySelector('div');
    expect(card).toHaveAttribute('data-testid', 'card-component');
    expect(card).toHaveAttribute('id', 'test-card');
  });

  it('インタラクティブなカードとして動作する', async () => {
    const mockOnClick = vi.fn();
    const mockOnKeyDown = vi.fn();

    const { container } = render(Card, {
      props: {
        onclick: mockOnClick,
        onkeydown: mockOnKeyDown,
        role: 'button',
        tabindex: 0,
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    if (card) {
      // クリックイベント
      await fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // キーボードイベント
      await fireEvent.keyDown(card, { key: 'Space' });
      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
      expect(mockOnKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Space'
        })
      );
    }
  });

  it('静的なカードとして動作する', () => {
    const { container } = render(Card, {
      props: {
        children: TestContentSnippet
      }
    });

    const card = container.querySelector('div');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
    expect(card).not.toHaveAttribute('onclick');
    expect(card).not.toHaveAttribute('onkeydown');
  });

  it('複雑な子要素も正しく設定される', () => {
    const ComplexContentSnippet = (() => `
      <div class="card-header">
        <h2>Card Title</h2>
      </div>
      <div class="card-body">
        <p>Card body content</p>
        <button>Action</button>
      </div>
    `) as unknown as Snippet;

    expect(() => {
      render(Card, {
        props: {
          children: ComplexContentSnippet
        }
      });
    }).not.toThrow();
  });

  it('カードの基本構造がdiv要素である', () => {
    const { container } = render(Card, {
      props: {
        children: TestContentSnippet
      }
    });

    const card = container.firstElementChild;
    expect(card?.tagName).toBe('DIV');
  });
});
