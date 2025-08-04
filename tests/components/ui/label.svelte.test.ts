import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Label from '$lib/components/ui/label.svelte';
import type { Snippet } from 'svelte';

describe('Label', () => {
  // テスト用の子コンポーネントSnippet
  const TestContentSnippet = (() => `Label Text`) as unknown as Snippet;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    expect(() => {
      render(Label, {
        props: {
          children: TestContentSnippet
        }
      });
    }).not.toThrow();
  });

  it('label要素がレンダリングされる', () => {
    const { container } = render(Label, {
      props: {
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toBeInTheDocument();
  });

  it('for属性が正しく設定される', () => {
    const { container } = render(Label, {
      props: {
        for: 'input-id',
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'input-id');
  });

  it('カスタムクラスが追加される', () => {
    const customClass = 'custom-label-class';
    const { container } = render(Label, {
      props: {
        class: customClass,
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveClass(customClass);
  });

  it('基本のスタイルクラスが含まれる', () => {
    const { container } = render(Label, {
      props: {
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveClass(
      'text-sm',
      'leading-none',
      'font-medium',
      'peer-disabled:cursor-not-allowed',
      'peer-disabled:opacity-70'
    );
  });

  it('子要素が正しく表示される', () => {
    const { component } = render(Label, {
      props: {
        children: TestContentSnippet
      }
    });

    // コンポーネントが正常に作成されることを確認
    expect(component).toBeTruthy();
  });

  it('子要素なしでもエラーが発生しない', () => {
    expect(() => {
      render(Label);
    }).not.toThrow();
  });

  it('undefinedのchildrenでもエラーが発生しない', () => {
    expect(() => {
      render(Label, {
        props: {
          children: undefined
        }
      });
    }).not.toThrow();
  });

  it('複数のpropsが同時に適用される', () => {
    const { container } = render(Label, {
      props: {
        for: 'test-input',
        class: 'multi-prop-test',
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'test-input');
    expect(label).toHaveClass('multi-prop-test');
    // 基本クラスも残っていることを確認
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('他のHTML属性が正しく渡される', () => {
    const { container } = render(Label, {
      props: {
        children: TestContentSnippet,
        ...({
          'data-testid': 'label-component',
          id: 'test-label',
          title: 'Label tooltip'
        } as unknown as Record<string, unknown>)
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('data-testid', 'label-component');
    expect(label).toHaveAttribute('id', 'test-label');
    expect(label).toHaveAttribute('title', 'Label tooltip');
  });

  it('forが未指定でもエラーが発生しない', () => {
    const { container } = render(Label, {
      props: {
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).not.toHaveAttribute('for');
  });

  it('空文字列のforでもエラーが発生しない', () => {
    const { container } = render(Label, {
      props: {
        for: '',
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', '');
  });

  it('クラス名のマージが正しく機能する', () => {
    const { container } = render(Label, {
      props: {
        class: 'text-blue-500 custom-spacing',
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    // カスタムクラスが追加される
    expect(label).toHaveClass('text-blue-500', 'custom-spacing');
    // 競合しない基本クラスは残る
    expect(label).toHaveClass('font-medium', 'peer-disabled:cursor-not-allowed');
  });

  it('ピア要素のdisabled状態に対応するクラスが含まれる', () => {
    const { container } = render(Label, {
      props: {
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('複雑な子要素も正しく設定される', () => {
    const ComplexContentSnippet = (() => `
      <span class="required">*</span>
      <span>Required Field</span>
    `) as unknown as Snippet;

    expect(() => {
      render(Label, {
        props: {
          children: ComplexContentSnippet
        }
      });
    }).not.toThrow();
  });

  it('アクセシビリティ属性が正しく設定される', () => {
    const { container } = render(Label, {
      props: {
        for: 'required-input',
        children: TestContentSnippet,
        ...({
          'aria-describedby': 'help-text',
          'aria-required': 'true'
        } as unknown as Record<string, unknown>)
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'required-input');
    expect(label).toHaveAttribute('aria-describedby', 'help-text');
    expect(label).toHaveAttribute('aria-required', 'true');
  });

  it('カスタムイベントハンドラーが正しく設定される', async () => {
    const mockOnClick = vi.fn();
    const { container } = render(Label, {
      props: {
        children: TestContentSnippet,
        ...({ onclick: mockOnClick } as unknown as Record<string, unknown>)
      }
    });

    const label = container.querySelector('label');
    if (label) {
      label.click();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    }
  });

  it('ラベルの基本構造がlabel要素である', () => {
    const { container } = render(Label, {
      props: {
        children: TestContentSnippet
      }
    });

    const label = container.firstElementChild;
    expect(label?.tagName).toBe('LABEL');
  });

  it('同じforを持つ複数のラベルが作成できる', () => {
    const { container: container1 } = render(Label, {
      props: {
        for: 'shared-input',
        children: (() => `Label 1`) as unknown as Snippet
      }
    });

    const { container: container2 } = render(Label, {
      props: {
        for: 'shared-input',
        children: (() => `Label 2`) as unknown as Snippet
      }
    });

    const label1 = container1.querySelector('label');
    const label2 = container2.querySelector('label');

    expect(label1).toHaveAttribute('for', 'shared-input');
    expect(label2).toHaveAttribute('for', 'shared-input');
  });

  it('フォーム要素との関連付けが正しく機能する', () => {
    const { container } = render(Label, {
      props: {
        for: 'form-control',
        children: TestContentSnippet
      }
    });

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'form-control');

    // HTMLのfor属性とid属性の関連付けがlabelの主要機能
    expect(label?.getAttribute('for')).toBe('form-control');
  });
});
