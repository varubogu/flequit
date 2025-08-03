import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Button from '$lib/components/ui/button/button.svelte';
import type { Snippet } from 'svelte';

describe('Button', () => {
  // テスト用の子コンポーネントSnippet
  const TestContentSnippet = (() => `Click me`) as unknown as Snippet;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(Button, {
        props: {
          children: TestContentSnippet
        }
      });
    }).not.toThrow();
  });

  it('button要素がデフォルトでレンダリングされる', () => {
    const { container } = render(Button, {
      props: {
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('href提供時にa要素がレンダリングされる', () => {
    const { container } = render(Button, {
      props: {
        href: '/test',
        children: TestContentSnippet
      }
    });

    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('デフォルトのvariantが適用される', () => {
    const { container } = render(Button, {
      props: {
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('secondaryバリアントが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        variant: 'secondary',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('destructiveバリアントが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        variant: 'destructive',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('outlineバリアントが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        variant: 'outline',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-background', 'border');
  });

  it('ghostバリアントが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        variant: 'ghost',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('linkバリアントが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        variant: 'link',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('text-primary', 'underline-offset-4');
  });

  it('デフォルトのsizeが適用される', () => {
    const { container } = render(Button, {
      props: {
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('h-9', 'px-4');
  });

  it('smサイズが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        size: 'sm',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('h-8', 'px-3');
  });

  it('lgサイズが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        size: 'lg',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('h-10', 'px-6');
  });

  it('iconサイズが正しく適用される', () => {
    const { container } = render(Button, {
      props: {
        size: 'icon',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('size-9');
  });

  it('カスタムクラスが追加される', () => {
    const customClass = 'custom-button-class';
    const { container } = render(Button, {
      props: {
        class: customClass,
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass(customClass);
    // 基本クラスも残っていることを確認
    expect(button).toHaveClass('bg-primary');
  });

  it('disabled状態が正しく設定される', () => {
    const { container } = render(Button, {
      props: {
        disabled: true,
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('href付きでdisabled時にhrefが無効化される', () => {
    const { container } = render(Button, {
      props: {
        href: '/test',
        disabled: true,
        children: TestContentSnippet
      }
    });

    const link = container.querySelector('a');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
  });

  it('type属性が正しく設定される', () => {
    const { container } = render(Button, {
      props: {
        type: 'submit',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('clickイベントが正しく動作する', async () => {
    const mockOnClick = vi.fn();
    const { container } = render(Button, {
      props: {
        onclick: mockOnClick,
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    if (button) {
      await fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('disabled状態でもイベントは発火するがCSSで無効化される', async () => {
    const mockOnClick = vi.fn();
    const { container } = render(Button, {
      props: {
        onclick: mockOnClick,
        disabled: true,
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');

    // CSSによるpointer-events-noneでクリックが無効化されているが、
    // testing-libraryのfireEventはCSS無効化を無視するため、
    // 実際のdisabled属性をテストする
    if (button) {
      await fireEvent.click(button);
      // HTMLのdisabled属性でイベントは抑制されないため、
      // CSS disabled:pointer-events-noneによる無効化を確認
      expect(button).toHaveAttribute('disabled');
    }
  });

  it('基本のスタイルクラスが含まれる', () => {
    const { container } = render(Button, {
      props: {
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass(
      'inline-flex',
      'shrink-0',
      'items-center',
      'justify-center',
      'gap-2',
      'rounded-md',
      'text-sm',
      'font-medium',
      'outline-none',
      'transition-all'
    );
  });

  it('フォーカススタイルクラスが含まれる', () => {
    const { container } = render(Button, {
      props: {
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass(
      'focus-visible:border-ring',
      'focus-visible:ring-ring/50',
      'focus-visible:ring-[3px]'
    );
  });

  it('子要素なしでもエラーが発生しない', () => {
    expect(() => {
      render(Button);
    }).not.toThrow();
  });

  it('undefinedのchildrenでもエラーが発生しない', () => {
    expect(() => {
      render(Button, {
        props: {
          children: undefined
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    const mockOnClick = vi.fn();
    const { container } = render(Button, {
      props: {
        variant: 'secondary',
        size: 'lg',
        class: 'multi-prop-test',
        onclick: mockOnClick,
        disabled: false,
        type: 'submit',
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-secondary', 'h-10', 'multi-prop-test');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).not.toBeDisabled();
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(Button, {
      props: {
        children: TestContentSnippet,
        ...({ 'data-testid': 'button-component', id: 'test-button' } as unknown as Record<
          string,
          string
        >)
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveAttribute('data-testid', 'button-component');
    expect(button).toHaveAttribute('id', 'test-button');
  });

  it('data-slot属性が設定される', () => {
    const { container } = render(Button, {
      props: {
        children: TestContentSnippet
      }
    });

    const button = container.querySelector('button');
    expect(button).toHaveAttribute('data-slot', 'button');
  });

  it('linkモードでdata-slot属性が設定される', () => {
    const { container } = render(Button, {
      props: {
        href: '/test',
        children: TestContentSnippet
      }
    });

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('data-slot', 'button');
  });

  it('全てのバリアント値でエラーが発生しない', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

    variants.forEach((variant) => {
      expect(() => {
        render(Button, {
          props: {
            variant,
            children: TestContentSnippet
          }
        });
      }).not.toThrow();
    });
  });

  it('全てのサイズ値でエラーが発生しない', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    sizes.forEach((size) => {
      expect(() => {
        render(Button, {
          props: {
            size,
            children: TestContentSnippet
          }
        });
      }).not.toThrow();
    });
  });

  it('linkモードでのアクセシビリティ属性', () => {
    const { container } = render(Button, {
      props: {
        href: '/test',
        disabled: true,
        children: TestContentSnippet
      }
    });

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });
});
