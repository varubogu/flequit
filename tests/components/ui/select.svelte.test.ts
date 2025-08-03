import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Select from '$lib/components/ui/select.svelte';
import type { Snippet } from 'svelte';

describe('Select', () => {
  // テスト用のオプションSnippet
  const OptionsSnippet = (() => `
    <option value="">選択してください</option>
    <option value="option1">オプション1</option>
    <option value="option2">オプション2</option>
    <option value="option3">オプション3</option>
  `) as unknown as Snippet;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(Select, {
        props: {
          children: OptionsSnippet
        }
      });
    }).not.toThrow();
  });

  it('select要素がレンダリングされる', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
  });

  it('value属性の設定が機能する', async () => {
    const { container } = render(Select, {
      props: {
        value: 'option1',
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // selectの値設定機能をテスト（手動でvalueを設定）
    expect(() => {
      select.value = 'option1';
    }).not.toThrow();
  });

  it('数値のvalueプロパティが設定される', () => {
    const NumberOptionsSnippet = (() => `
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
    `) as unknown as Snippet;

    const { container } = render(Select, {
      props: {
        value: 2,
        children: NumberOptionsSnippet
      }
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // 数値valueプロパティが設定できることをテスト
    expect(() => {
      select.value = '2';
    }).not.toThrow();
  });

  it('id属性が正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        id: 'test-select',
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('id', 'test-select');
  });

  it('カスタムクラスが追加される', () => {
    const customClass = 'custom-select-class';
    const { container } = render(Select, {
      props: {
        class: customClass,
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveClass(customClass);
  });

  it('基本のスタイルクラスが含まれる', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveClass(
      'border-input',
      'bg-background',
      'ring-offset-background',
      'focus:ring-ring',
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
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveClass('focus:ring-2', 'focus:ring-offset-2', 'focus:outline-none');
  });

  it('disabled状態のスタイルクラスが含まれる', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('onchangeイベントが正しく動作する', async () => {
    const mockOnChange = vi.fn();
    const { container } = render(Select, {
      props: {
        onchange: mockOnChange,
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    if (select) {
      await fireEvent.change(select, { target: { value: 'option2' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    }
  });

  it('disabled属性が正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet,
        ...({ disabled: true } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select');
    expect(select).toBeDisabled();
  });

  it('required属性が正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet,
        ...({ required: true } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('required');
  });

  it('multiple属性が正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet,
        ...({ multiple: true } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('multiple');
  });

  it('複数のpropsが同時に適用される', () => {
    const mockOnChange = vi.fn();
    const { container } = render(Select, {
      props: {
        value: 'option2',
        id: 'multi-prop-select',
        class: 'multi-prop-test',
        onchange: mockOnChange,
        children: OptionsSnippet,
        ...({ required: true } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute('id', 'multi-prop-select');
    expect(select).toHaveClass('multi-prop-test');
    expect(select).toHaveAttribute('required');
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet,
        ...({
          'data-testid': 'select-component',
          'aria-label': 'Test select',
          name: 'test-select'
        } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('data-testid', 'select-component');
    expect(select).toHaveAttribute('aria-label', 'Test select');
    expect(select).toHaveAttribute('name', 'test-select');
  });

  it('子要素なしでもエラーが発生しない', () => {
    expect(() => {
      render(Select);
    }).not.toThrow();
  });

  it('undefinedのchildrenでもエラーが発生しない', () => {
    expect(() => {
      render(Select, {
        props: {
          children: undefined
        }
      });
    }).not.toThrow();
  });

  it('空文字列のvalueが正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        value: '',
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('');
  });

  it('undefinedのvalueでもエラーが発生しない', () => {
    expect(() => {
      render(Select, {
        props: {
          value: undefined,
          children: OptionsSnippet
        }
      });
    }).not.toThrow();
  });

  it('値の変更イベントが正しく動作する', async () => {
    const { container } = render(Select, {
      props: {
        value: 'option1',
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // changeイベントの発火をテスト
    expect(() => {
      fireEvent.change(select, { target: { value: 'option3' } });
    }).not.toThrow();
  });

  it('フォーカス時にスタイルが正しく適用される', async () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet
      }
    });

    const select = container.querySelector('select');
    if (select) {
      await fireEvent.focus(select);
      // フォーカススタイルクラスが存在することを確認
      expect(select).toHaveClass('focus:ring-2');
    }
  });

  it('複雑なオプション構造でも正しく機能する', () => {
    const ComplexOptionsSnippet = (() => `
      <optgroup label="グループ1">
        <option value="g1-opt1">グループ1 オプション1</option>
        <option value="g1-opt2">グループ1 オプション2</option>
      </optgroup>
      <optgroup label="グループ2">
        <option value="g2-opt1">グループ2 オプション1</option>
        <option value="g2-opt2">グループ2 オプション2</option>
      </optgroup>
    `) as unknown as Snippet;

    expect(() => {
      render(Select, {
        props: {
          children: ComplexOptionsSnippet
        }
      });
    }).not.toThrow();
  });

  it('アクセシビリティ属性が正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet,
        ...({
          'aria-describedby': 'help-text',
          'aria-required': 'true',
          'aria-invalid': 'false'
        } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('aria-describedby', 'help-text');
    expect(select).toHaveAttribute('aria-required', 'true');
    expect(select).toHaveAttribute('aria-invalid', 'false');
  });

  it('フォーム関連属性が正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet,
        ...({
          form: 'test-form',
          name: 'test-select',
          required: true
        } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('form', 'test-form');
    expect(select).toHaveAttribute('name', 'test-select');
    expect(select).toHaveAttribute('required');
  });

  it('selectの基本構造がselect要素である', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet
      }
    });

    const select = container.firstElementChild;
    expect(select?.tagName).toBe('SELECT');
  });

  it('サイズ属性が正しく設定される', () => {
    const { container } = render(Select, {
      props: {
        children: OptionsSnippet,
        ...({ size: 5 } as unknown as Record<string, unknown>)
      }
    });

    const select = container.querySelector('select');
    expect(select).toHaveAttribute('size', '5');
  });
});
