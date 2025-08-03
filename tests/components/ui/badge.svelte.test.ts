import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Badge from '$lib/components/ui/badge.svelte';
import type { Snippet } from 'svelte';

describe('Badge', () => {
  // テスト用の子コンポーネントSnippet
  const TestContentSnippet = (() => `Test Badge`) as unknown as Snippet;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(Badge, {
        props: {
          children: TestContentSnippet
        }
      });
    }).not.toThrow();
  });

  it('デフォルトのvariantが適用される', () => {
    const { container } = render(Badge, {
      props: {
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('secondaryバリアントが正しく適用される', () => {
    const { container } = render(Badge, {
      props: {
        variant: 'secondary',
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('destructiveバリアントが正しく適用される', () => {
    const { container } = render(Badge, {
      props: {
        variant: 'destructive',
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  it('outlineバリアントが正しく適用される', () => {
    const { container } = render(Badge, {
      props: {
        variant: 'outline',
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass('text-foreground');
  });

  it('カスタムクラスが追加される', () => {
    const customClass = 'custom-badge-class';
    const { container } = render(Badge, {
      props: {
        class: customClass,
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass(customClass);
  });

  it('カスタムスタイルが適用される', () => {
    const customStyle = 'color: red;';
    const { container } = render(Badge, {
      props: {
        style: customStyle,
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveAttribute('style', customStyle);
  });

  it('基本のスタイルクラスが含まれる', () => {
    const { container } = render(Badge, {
      props: {
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold'
    );
  });

  it('フォーカススタイルクラスが含まれる', () => {
    const { container } = render(Badge, {
      props: {
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    );
  });

  it('トランジションクラスが含まれる', () => {
    const { container } = render(Badge, {
      props: {
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass('transition-colors');
  });

  it('子要素なしでもエラーが発生しない', () => {
    expect(() => {
      render(Badge);
    }).not.toThrow();
  });

  it('undefinedのchildrenでもエラーが発生しない', () => {
    expect(() => {
      render(Badge, {
        props: {
          children: undefined
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    const { container } = render(Badge, {
      props: {
        variant: 'secondary',
        class: 'extra-class',
        style: 'margin: 10px;',
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass('bg-secondary', 'extra-class');
    expect(badge).toHaveAttribute('style', 'margin: 10px;');
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(Badge, {
      props: {
        children: TestContentSnippet,
        ...({ id: 'test-badge', 'data-testid': 'badge-component' } as unknown as Record<
          string,
          string
        >)
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveAttribute('id', 'test-badge');
    expect(badge).toHaveAttribute('data-testid', 'badge-component');
  });

  it('全てのバリアント値でエラーが発生しない', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const;

    variants.forEach((variant) => {
      expect(() => {
        render(Badge, {
          props: {
            variant,
            children: TestContentSnippet
          }
        });
      }).not.toThrow();
    });
  });

  it('バリアントがundefinedの場合デフォルトが適用される', () => {
    const { container } = render(Badge, {
      props: {
        variant: undefined,
        children: TestContentSnippet
      }
    });

    const badge = container.querySelector('div');
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});
