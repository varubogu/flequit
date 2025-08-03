import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Textarea from '$lib/components/ui/textarea.svelte';

describe('Textarea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(Textarea);
    }).not.toThrow();
  });

  it('textarea要素がレンダリングされる', () => {
    const { container } = render(Textarea);

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
  });

  it('value属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        value: 'test content'
      }
    });

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('test content');
  });

  it('placeholder属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        placeholder: 'Enter your text here'
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Enter your text here');
  });

  it('id属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        id: 'test-textarea'
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('id', 'test-textarea');
  });

  it('カスタムクラスが追加される', () => {
    const customClass = 'custom-textarea-class';
    const { container } = render(Textarea, {
      props: {
        class: customClass
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass(customClass);
  });

  it('基本のスタイルクラスが含まれる', () => {
    const { container } = render(Textarea);

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass(
      'border-input',
      'bg-background',
      'ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:ring-ring',
      'flex',
      'min-h-[80px]',
      'w-full',
      'rounded-md',
      'border',
      'px-3',
      'py-2',
      'text-sm'
    );
  });

  it('フォーカススタイルクラスが含まれる', () => {
    const { container } = render(Textarea);

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-offset-2',
      'focus-visible:outline-none'
    );
  });

  it('disabled状態のスタイルクラスが含まれる', () => {
    const { container } = render(Textarea);

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('oninputイベントが正しく動作する', async () => {
    const mockOnInput = vi.fn();
    const { container } = render(Textarea, {
      props: {
        oninput: mockOnInput
      }
    });

    const textarea = container.querySelector('textarea');
    if (textarea) {
      await fireEvent.input(textarea, { target: { value: 'test input' } });
      expect(mockOnInput).toHaveBeenCalledTimes(1);
    }
  });

  it('disabled属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ disabled: true } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeDisabled();
  });

  it('readonly属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ readonly: true } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('required属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ required: true } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('required');
  });

  it('rows属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ rows: 5 } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('cols属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ cols: 50 } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('cols', '50');
  });

  it('複数のpropsが同時に適用される', () => {
    const mockOnInput = vi.fn();
    const { container } = render(Textarea, {
      props: {
        value: 'initial text',
        placeholder: 'Enter text here',
        id: 'multi-prop-textarea',
        class: 'multi-prop-test',
        oninput: mockOnInput,
        ...({ required: true } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('initial text');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here');
    expect(textarea).toHaveAttribute('id', 'multi-prop-textarea');
    expect(textarea).toHaveClass('multi-prop-test');
    expect(textarea).toHaveAttribute('required');
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({
          'data-testid': 'textarea-component',
          'aria-label': 'Test textarea',
          name: 'test-textarea'
        } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('data-testid', 'textarea-component');
    expect(textarea).toHaveAttribute('aria-label', 'Test textarea');
    expect(textarea).toHaveAttribute('name', 'test-textarea');
  });

  it('空文字列のvalueが正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        value: ''
      }
    });

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
  });

  it('undefinedのvalueでもエラーが発生しない', () => {
    expect(() => {
      render(Textarea, {
        props: {
          value: undefined
        }
      });
    }).not.toThrow();
  });

  it('複数行のテキストが正しく設定される', () => {
    const multilineText = 'Line 1\nLine 2\nLine 3';
    const { container } = render(Textarea, {
      props: {
        value: multilineText
      }
    });

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(multilineText);
  });

  it('値の変更が正しく反映される', async () => {
    const { container } = render(Textarea, {
      props: {
        value: 'initial text'
      }
    });

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('initial text');

    await fireEvent.input(textarea, { target: { value: 'updated text' } });
    expect(textarea.value).toBe('updated text');
  });

  it('フォーカス時にスタイルが正しく適用される', async () => {
    const { container } = render(Textarea);

    const textarea = container.querySelector('textarea');
    if (textarea) {
      await fireEvent.focus(textarea);
      // フォーカススタイルクラスが存在することを確認
      expect(textarea).toHaveClass('focus-visible:ring-2');
    }
  });

  it('アクセシビリティ属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({
          'aria-describedby': 'help-text',
          'aria-required': 'true',
          'aria-invalid': 'false'
        } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('aria-describedby', 'help-text');
    expect(textarea).toHaveAttribute('aria-required', 'true');
    expect(textarea).toHaveAttribute('aria-invalid', 'false');
  });

  it('フォーム関連属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({
          form: 'test-form',
          name: 'test-textarea',
          required: true
        } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('form', 'test-form');
    expect(textarea).toHaveAttribute('name', 'test-textarea');
    expect(textarea).toHaveAttribute('required');
  });

  it('textareaの基本構造がtextarea要素である', () => {
    const { container } = render(Textarea);

    const textarea = container.firstElementChild;
    expect(textarea?.tagName).toBe('TEXTAREA');
  });

  it('maxlength属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ maxlength: 100 } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('maxlength', '100');
  });

  it('minlength属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ minlength: 10 } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('minlength', '10');
  });

  it('wrap属性が正しく設定される', () => {
    const { container } = render(Textarea, {
      props: {
        ...({ wrap: 'soft' } as unknown as Record<string, unknown>)
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('wrap', 'soft');
  });

  it('resize属性のスタイリングが機能する', () => {
    const { container } = render(Textarea, {
      props: {
        class: 'resize-none'
      }
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveClass('resize-none');
  });
});
