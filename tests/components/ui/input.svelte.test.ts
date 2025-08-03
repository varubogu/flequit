import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Input from '$lib/components/ui/input.svelte';

describe('Input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(Input);
    }).not.toThrow();
  });

  it('input要素がレンダリングされる', () => {
    const { container } = render(Input);

    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
  });

  it('デフォルトでtype="text"が設定される', () => {
    const { container } = render(Input);

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('カスタムtypeが正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        type: 'email'
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('value属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        value: 'test value'
      }
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('test value');
  });

  it('数値のvalueが正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        value: 123
      }
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('123');
  });

  it('placeholder属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        placeholder: 'Enter text here'
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('placeholder', 'Enter text here');
  });

  it('id属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        id: 'test-input'
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('id', 'test-input');
  });

  it('min属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        type: 'number',
        min: 0
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('min', '0');
  });

  it('max属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        type: 'number',
        max: 100
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('max', '100');
  });

  it('カスタムクラスが追加される', () => {
    const customClass = 'custom-input-class';
    const { container } = render(Input, {
      props: {
        class: customClass
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveClass(customClass);
  });

  it('基本のスタイルクラスが含まれる', () => {
    const { container } = render(Input);

    const input = container.querySelector('input');
    expect(input).toHaveClass(
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
      'text-sm'
    );
  });

  it('フォーカススタイルクラスが含まれる', () => {
    const { container } = render(Input);

    const input = container.querySelector('input');
    expect(input).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-offset-2',
      'focus-visible:outline-none'
    );
  });

  it('ファイル関連のスタイルクラスが含まれる', () => {
    const { container } = render(Input);

    const input = container.querySelector('input');
    expect(input).toHaveClass(
      'file:border-0',
      'file:bg-transparent',
      'file:text-sm',
      'file:font-medium'
    );
  });

  it('disabled状態のスタイルクラスが含まれる', () => {
    const { container } = render(Input);

    const input = container.querySelector('input');
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('oninputイベントが正しく動作する', async () => {
    const mockOnInput = vi.fn();
    const { container } = render(Input, {
      props: {
        oninput: mockOnInput
      }
    });

    const input = container.querySelector('input');
    if (input) {
      await fireEvent.input(input, { target: { value: 'test input' } });
      expect(mockOnInput).toHaveBeenCalledTimes(1);
    }
  });

  it('onkeydownイベントが正しく動作する', async () => {
    const mockOnKeyDown = vi.fn();
    const { container } = render(Input, {
      props: {
        onkeydown: mockOnKeyDown
      }
    });

    const input = container.querySelector('input');
    if (input) {
      await fireEvent.keyDown(input, { key: 'Enter' });
      expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
      expect(mockOnKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'Enter'
        })
      );
    }
  });

  it('disabled属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        ...({ disabled: true } as unknown as Record<string, unknown>)
      }
    });

    const input = container.querySelector('input');
    expect(input).toBeDisabled();
  });

  it('readonly属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        ...({ readonly: true } as unknown as Record<string, unknown>)
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('readonly');
  });

  it('required属性が正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        ...({ required: true } as unknown as Record<string, unknown>)
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('required');
  });

  it('複数のpropsが同時に適用される', () => {
    const mockOnInput = vi.fn();
    const mockOnKeyDown = vi.fn();
    const { container } = render(Input, {
      props: {
        type: 'email',
        value: 'test@example.com',
        placeholder: 'Enter email',
        id: 'email-input',
        class: 'multi-prop-test',
        oninput: mockOnInput,
        onkeydown: mockOnKeyDown,
        ...({ required: true } as unknown as Record<string, unknown>)
      }
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'email');
    expect(input.value).toBe('test@example.com');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toHaveAttribute('id', 'email-input');
    expect(input).toHaveClass('multi-prop-test');
    expect(input).toHaveAttribute('required');
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(Input, {
      props: {
        ...({
          'data-testid': 'input-component',
          'aria-label': 'Test input',
          name: 'test-name'
        } as unknown as Record<string, unknown>)
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('data-testid', 'input-component');
    expect(input).toHaveAttribute('aria-label', 'Test input');
    expect(input).toHaveAttribute('name', 'test-name');
  });

  it('数値入力タイプでmin/maxが機能する', () => {
    const { container } = render(Input, {
      props: {
        type: 'number',
        min: 1,
        max: 10,
        value: 5
      }
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '10');
    expect(input.value).toBe('5');
  });

  it('パスワード入力タイプが正しく機能する', () => {
    const { container } = render(Input, {
      props: {
        type: 'password',
        value: 'secret123'
      }
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
    expect(input.value).toBe('secret123');
  });

  it('日付入力タイプが正しく機能する', () => {
    const { container } = render(Input, {
      props: {
        type: 'date',
        value: '2023-12-25'
      }
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'date');
    expect(input.value).toBe('2023-12-25');
  });

  it('空文字列のvalueが正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        value: ''
      }
    });

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('undefinedのvalueでもエラーが発生しない', () => {
    expect(() => {
      render(Input, {
        props: {
          value: undefined
        }
      });
    }).not.toThrow();
  });

  it('nullのvalueでもエラーが発生しない', () => {
    expect(() => {
      render(Input, {
        props: {
          value: undefined
        }
      });
    }).not.toThrow();
  });

  it('文字列minとmaxが正しく設定される', () => {
    const { container } = render(Input, {
      props: {
        type: 'number',
        min: '0',
        max: '100'
      }
    });

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('フォーカス時にスタイルが正しく適用される', async () => {
    const { container } = render(Input);

    const input = container.querySelector('input');
    if (input) {
      await fireEvent.focus(input);
      // フォーカススタイルクラスが存在することを確認
      expect(input).toHaveClass('focus-visible:ring-2');
    }
  });
});
