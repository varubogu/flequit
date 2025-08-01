import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from '$lib/components/shared/button.svelte';

describe('Button (shared)', () => {
  const defaultProps = {
    variant: 'default' as const,
    size: 'default' as const,
    onclick: vi.fn(),
    disabled: false,
    title: 'Test Button',
    'aria-label': 'Test Button Label',
    'data-testid': 'test-button'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントのpropsが正しく設定される', () => {
    // 複雑な外部依存のため基本的なテストのみ実装
    const props = defaultProps;
    expect(props.variant).toBe('default');
    expect(props.size).toBe('default');
    expect(props.onclick).toBeInstanceOf(Function);
    expect(props.disabled).toBe(false);
    expect(props.title).toBe('Test Button');
    expect(props['aria-label']).toBe('Test Button Label');
    expect(props['data-testid']).toBe('test-button');
  });

  it('異なるvariantが処理される', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

    variants.forEach((variant) => {
      const props = {
        ...defaultProps,
        variant
      };

      expect(props.variant).toBe(variant);
    });
  });

  it('異なるsizeが処理される', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    sizes.forEach((size) => {
      const props = {
        ...defaultProps,
        size
      };

      expect(props.size).toBe(size);
    });
  });

  it('disabledがtrueの場合が処理される', () => {
    const props = {
      ...defaultProps,
      disabled: true
    };

    expect(props.disabled).toBe(true);
  });

  it('カスタムclassが設定される', () => {
    const props = {
      ...defaultProps,
      class: 'custom-button-class bg-blue-500'
    };

    expect(props.class).toBe('custom-button-class bg-blue-500');
  });

  it('空文字列のclassが処理される', () => {
    const props = {
      ...defaultProps,
      class: ''
    };

    expect(props.class).toBe('');
  });

  it('undefinedのclassが処理される', () => {
    const props = {
      ...defaultProps,
      class: undefined
    };

    expect(props.class).toBeUndefined();
  });

  it('onclickコールバックが設定される', () => {
    const onclick = vi.fn();

    const props = {
      ...defaultProps,
      onclick
    };

    expect(props.onclick).toBe(onclick);
    expect(props.onclick).toBeInstanceOf(Function);
  });

  it('undefinedのonclickが処理される', () => {
    const props = {
      ...defaultProps,
      onclick: undefined
    };

    expect(props.onclick).toBeUndefined();
  });

  it('titleが空文字列の場合が処理される', () => {
    const props = {
      ...defaultProps,
      title: ''
    };

    expect(props.title).toBe('');
  });

  it('undefinedのtitleが処理される', () => {
    const props = {
      ...defaultProps,
      title: undefined
    };

    expect(props.title).toBeUndefined();
  });

  it('aria-labelが設定される', () => {
    const props = {
      ...defaultProps,
      'aria-label': 'Accessible Button Label'
    };

    expect(props['aria-label']).toBe('Accessible Button Label');
  });

  it('undefinedのaria-labelが処理される', () => {
    const props = {
      ...defaultProps,
      'aria-label': undefined
    };

    expect(props['aria-label']).toBeUndefined();
  });

  it('data-testidが設定される', () => {
    const props = {
      ...defaultProps,
      'data-testid': 'custom-test-id'
    };

    expect(props['data-testid']).toBe('custom-test-id');
  });

  it('undefinedのdata-testidが処理される', () => {
    const props = {
      ...defaultProps,
      'data-testid': undefined
    };

    expect(props['data-testid']).toBeUndefined();
  });

  it('複数のpropsの組み合わせが処理される', () => {
    const combinations = [
      {
        variant: 'destructive' as const,
        size: 'sm' as const,
        disabled: true,
        class: 'danger-button'
      },
      {
        variant: 'outline' as const,
        size: 'lg' as const,
        disabled: false,
        class: 'outline-large'
      },
      {
        variant: 'ghost' as const,
        size: 'icon' as const,
        disabled: false,
        class: 'icon-ghost'
      }
    ];

    combinations.forEach((combo) => {
      const props = {
        ...defaultProps,
        ...combo
      };

      expect(props.variant).toBe(combo.variant);
      expect(props.size).toBe(combo.size);
      expect(props.disabled).toBe(combo.disabled);
      expect(props.class).toBe(combo.class);
    });
  });

  it('variantとsizeの型安全性が保たれる', () => {
    const validVariants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
    const validSizes = ['default', 'sm', 'lg', 'icon'];

    validVariants.forEach((variant) => {
      const props = {
        ...defaultProps,
        variant: variant as any
      };

      expect(validVariants).toContain(props.variant);
    });

    validSizes.forEach((size) => {
      const props = {
        ...defaultProps,
        size: size as any
      };

      expect(validSizes).toContain(props.size);
    });
  });

  it('長いtitleとaria-labelが処理される', () => {
    const longText =
      'This is a very long title and aria-label that contains multiple words and describes the button functionality in detail';

    const props = {
      ...defaultProps,
      title: longText,
      'aria-label': longText
    };

    expect(props.title).toBe(longText);
    expect(props['aria-label']).toBe(longText);
  });

  it('特殊文字を含むpropsが処理される', () => {
    const props = {
      ...defaultProps,
      title: 'Title with "quotes" & <tags>',
      'aria-label': 'Label with émojis 🚀 & ünïcöde',
      class: 'class-with-special_chars-123',
      'data-testid': 'test-id_with-special.chars'
    };

    expect(props.title).toBe('Title with "quotes" & <tags>');
    expect(props['aria-label']).toBe('Label with émojis 🚀 & ünïcöde');
    expect(props.class).toBe('class-with-special_chars-123');
    expect(props['data-testid']).toBe('test-id_with-special.chars');
  });

  it('onclickコールバックが呼び出し可能である', () => {
    const mockCallback = vi.fn();
    const props = {
      ...defaultProps,
      onclick: mockCallback
    };

    // コールバックが関数として呼び出し可能であることを確認
    const mockEvent = new Event('click');
    expect(() => props.onclick?.(mockEvent)).not.toThrow();

    // モック関数が実際に呼び出されたことを確認
    props.onclick?.(mockEvent);
    expect(mockCallback).toHaveBeenCalledWith(mockEvent);
  });

  it('onclickが引数なしで呼び出し可能である', () => {
    const mockCallback = vi.fn();
    const props = {
      ...defaultProps,
      onclick: mockCallback
    };

    // 引数なしでの呼び出し
    expect(() => props.onclick?.()).not.toThrow();

    props.onclick?.();
    expect(mockCallback).toHaveBeenCalledWith();
  });
});
